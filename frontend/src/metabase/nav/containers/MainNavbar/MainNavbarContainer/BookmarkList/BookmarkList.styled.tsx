// eslint-disable-next-line no-restricted-imports
import styled from "@emotion/styled";

import { color } from "metabase/lib/colors";

import { DraggableSidebarLink } from "../../SidebarItems";

export const SidebarBookmarkItem = styled(DraggableSidebarLink)`
  padding-left: 0.75rem;

  &:hover,
  &:focus,
  &:focus-within,
  :focus & {
    button {
      color: var(--mb-color-brand);
      opacity: 0.5;

      > svg:focus {
        outline: none;
      }
    }
  }

  button {
    opacity: 0;
    color: ${(props) =>
      props.isSelected ? color("text-white") : color("brand")};
    cursor: pointer;
    margin-top: 3px;

    > svg:focus {
      outline: none;
    }
  }
`;
