import { useCallback, useMemo } from "react";
import { t } from "ttag";
import _ from "underscore";
import * as Yup from "yup";

import FormCollectionPicker from "metabase/collections/containers/FormCollectionPicker";
import { canonicalCollectionId } from "metabase/collections/utils";
import Button from "metabase/common/components/Button";
import FormErrorMessage from "metabase/common/components/FormErrorMessage";
import FormInput from "metabase/common/components/FormInput";
import FormSubmitButton from "metabase/common/components/FormSubmitButton";
import FormTextArea from "metabase/common/components/FormTextArea";
import SnippetCollections from "metabase/entities/snippet-collections";
import Snippets from "metabase/entities/snippets";
import { Form, FormProvider } from "metabase/forms";
import * as Errors from "metabase/lib/errors";
import { connect } from "metabase/lib/redux";
import { Flex } from "metabase/ui";
import type {
  Collection,
  NativeQuerySnippet,
  NativeQuerySnippetId,
} from "metabase-types/api";

import S from "./SnippetForm.module.css";

const SNIPPET_SCHEMA = Yup.object({
  name: Yup.string()
    .required(Errors.required)
    .max(100, Errors.maxLength)
    .default(""),
  description: Yup.string().nullable().max(500, Errors.maxLength).default(null),
  content: Yup.string()
    .required(Errors.required)
    .max(10000, Errors.maxLength)
    .default(""),
  collection_id: Yup.number().nullable().default(null),
});

type SnippetFormValues = Pick<
  NativeQuerySnippet,
  "name" | "description" | "content" | "collection_id"
>;

type UpdateSnippetFormValues = Partial<SnippetFormValues> &
  Pick<NativeQuerySnippet, "id"> & {
    archived?: boolean;
  };

export interface SnippetFormOwnProps {
  snippet: Partial<NativeQuerySnippet>;
  onCreate?: (snippet: NativeQuerySnippet) => void;
  onUpdate?: (
    nextSnippet: NativeQuerySnippet,
    originalSnippet: NativeQuerySnippet,
  ) => void;
  onArchive?: () => void;
  onCancel?: () => void;
}

interface SnippetLoaderProps {
  snippetCollections: Collection[];
}

interface SnippetFormDispatchProps {
  handleCreateSnippet: (
    snippet: SnippetFormValues,
  ) => Promise<NativeQuerySnippet>;
  handleUpdateSnippet: (
    snippet: UpdateSnippetFormValues,
  ) => Promise<NativeQuerySnippet>;
}

type SnippetFormProps = SnippetFormOwnProps &
  SnippetLoaderProps &
  SnippetFormDispatchProps;

const mapDispatchToProps = {
  handleCreateSnippet: Snippets.actions.create,
  handleUpdateSnippet: Snippets.actions.update,
};

function SnippetForm({
  snippet,
  snippetCollections,
  handleCreateSnippet,
  handleUpdateSnippet,
  onCreate,
  onUpdate,
  onArchive,
  onCancel,
}: SnippetFormProps) {
  const isEditing = snippet.id != null;
  const hasManyCollections = snippetCollections.length > 1;

  const initialValues = useMemo(
    () =>
      SNIPPET_SCHEMA.cast(
        {
          ...snippet,
          content: snippet.content || "",
          parent_id: canonicalCollectionId(snippet.id),
        },
        { stripUnknown: true },
      ),
    [snippet],
  );

  const handleCreate = useCallback(
    async (values: SnippetFormValues) => {
      const action = await handleCreateSnippet(values);
      const snippet = Snippets.HACK_getObjectFromAction(action);
      onCreate?.(snippet);
    },
    [handleCreateSnippet, onCreate],
  );

  const handleUpdate = useCallback(
    async (values: UpdateSnippetFormValues) => {
      const action = await handleUpdateSnippet(values);
      const nextSnippet = Snippets.HACK_getObjectFromAction(action);
      onUpdate?.(nextSnippet, snippet as NativeQuerySnippet);
    },
    [snippet, handleUpdateSnippet, onUpdate],
  );

  const handleSubmit = useCallback(
    async (values: SnippetFormValues) => {
      if (isEditing && snippet.id) {
        await handleUpdate({ ...values, id: snippet.id });
      } else {
        await handleCreate(values);
      }
    },
    [snippet.id, isEditing, handleCreate, handleUpdate],
  );

  const handleArchive = useCallback(async () => {
    await handleUpdateSnippet({
      id: snippet.id as NativeQuerySnippetId,
      archived: true,
    });
    onArchive?.();
  }, [snippet.id, handleUpdateSnippet, onArchive]);

  return (
    <FormProvider
      initialValues={initialValues}
      validationSchema={SNIPPET_SCHEMA}
      onSubmit={handleSubmit}
    >
      {({ dirty }) => (
        <Form disabled={!dirty} className={S.SnippetForm}>
          <FormTextArea
            inputClassName={S.FormSnippetTextArea}
            name="content"
            title={t`Enter some SQL here so you can reuse it later`}
            placeholder="AND canceled_at IS null\nAND account_type = 'PAID'"
            autoFocus
            rows={4}
          />
          <FormInput
            name="name"
            title={t`Give your snippet a name`}
            placeholder={t`Current Customers`}
          />
          <FormInput
            name="description"
            title={t`Add a description`}
            placeholder={t`It's optional but oh, so helpful`}
            nullable
          />
          {hasManyCollections && (
            <FormCollectionPicker
              name="collection_id"
              title={t`Folder this should be in`}
              type="snippet-collections"
            />
          )}
          <Flex align="center" justify="space-between">
            <Flex align="center" justify="center" gap="sm">
              {isEditing && (
                <Button
                  type="button"
                  icon="archive"
                  borderless
                  onClick={handleArchive}
                >{t`Archive`}</Button>
              )}
              <FormErrorMessage inline />
            </Flex>
            <Flex align="center" justify="center" gap="sm">
              {!!onCancel && (
                <Button type="button" onClick={onCancel}>{t`Cancel`}</Button>
              )}
              <FormSubmitButton title={t`Save`} disabled={!dirty} primary />
            </Flex>
          </Flex>
        </Form>
      )}
    </FormProvider>
  );
}

// eslint-disable-next-line import/no-default-export -- deprecated usage
export default _.compose(
  SnippetCollections.loadList(),
  connect(null, mapDispatchToProps),
)(SnippetForm);
