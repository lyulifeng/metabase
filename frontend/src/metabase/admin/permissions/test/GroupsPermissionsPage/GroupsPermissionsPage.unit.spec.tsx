import userEvent from "@testing-library/user-event";
import fetchMock from "fetch-mock";
import { Route } from "react-router";

import { callMockEvent } from "__support__/events";
import {
  setupDatabasesEndpoints,
  setupGroupsEndpoint,
  setupPermissionsGraphEndpoints,
} from "__support__/server-mocks";
import {
  renderWithProviders,
  screen,
  waitForLoaderToBeRemoved,
} from "__support__/ui";
import { delay } from "__support__/utils";
import DataPermissionsPage from "metabase/admin/permissions/pages/DataPermissionsPage/DataPermissionsPage";
import GroupsPermissionsPage from "metabase/admin/permissions/pages/GroupDataPermissionsPage/GroupsPermissionsPage";
import { BEFORE_UNLOAD_UNSAVED_MESSAGE } from "metabase/common/hooks/use-before-unload";
import { PLUGIN_ADMIN_PERMISSIONS_TABLE_ROUTES } from "metabase/plugins";
import { createMockGroup } from "metabase-types/api/mocks/group";
import { createSampleDatabase } from "metabase-types/api/mocks/presets";

const NATIVE_QUERIES_PERMISSION_INDEX = 0;

const TEST_DATABASE = createSampleDatabase();

const TEST_GROUPS = [
  createMockGroup({ id: 2, name: "Administrators" }),
  createMockGroup({ name: "All Users" }),
];

const setup = async ({
  initialRoute = `/admin/permissions/data/group/${TEST_GROUPS[1].id}`,
} = {}) => {
  setupDatabasesEndpoints([TEST_DATABASE]);
  setupPermissionsGraphEndpoints(TEST_GROUPS, [TEST_DATABASE]);
  setupGroupsEndpoint(TEST_GROUPS);

  fetchMock.get(
    `path:/api/database/${TEST_DATABASE.id}/metadata`,
    TEST_DATABASE,
  );

  const mockEventListener = jest.spyOn(window, "addEventListener");

  renderWithProviders(
    <Route path="/admin/permissions/data" component={DataPermissionsPage}>
      <Route
        path="group(/:groupId)(/database/:databaseId)(/schema/:schemaName)"
        component={GroupsPermissionsPage}
      >
        {PLUGIN_ADMIN_PERMISSIONS_TABLE_ROUTES}
      </Route>
    </Route>,
    {
      withRouter: true,
      initialRoute,
    },
  );

  await waitForLoaderToBeRemoved();

  return { mockEventListener };
};

const editDatabasePermission = async () => {
  const permissionsSelectElem = (
    await screen.findAllByTestId("permissions-select")
  )[NATIVE_QUERIES_PERMISSION_INDEX];
  await userEvent.click(permissionsSelectElem);

  const clickElement = await screen.findByLabelText(/close icon/);
  await userEvent.click(clickElement);

  await delay(0);
};

describe("GroupsPermissionsPage", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("rendering", () => {
    it("should show 'Cancel' and 'Save Changes' when user makes changes to permissions", async () => {
      await setup();

      await editDatabasePermission();

      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Save changes")).toBeInTheDocument();
    });
  });

  describe("triggering beforeunload events", () => {
    it("should generate beforeunload event when user edits database permissions", async () => {
      const { mockEventListener } = await setup();

      await editDatabasePermission();

      const mockEvent = callMockEvent(mockEventListener, "beforeunload");

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.returnValue).toBe(BEFORE_UNLOAD_UNSAVED_MESSAGE);
    });

    it("should not have beforeunload event when permissions are unedited", async function () {
      const { mockEventListener } = await setup();
      const mockEvent = callMockEvent(mockEventListener, "beforeunload");
      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.returnValue).toBe(undefined);
    });
  });
});
