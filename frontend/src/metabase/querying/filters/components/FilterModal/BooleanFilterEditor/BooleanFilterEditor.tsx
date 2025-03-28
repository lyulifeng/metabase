import { useMemo } from "react";
import { t } from "ttag";

import { getColumnIcon } from "metabase/common/utils/columns";
import { useBooleanOperatorFilter } from "metabase/querying/filters/hooks/use-boolean-operator-filter";
import { Checkbox, Grid, Group } from "metabase/ui";
import type * as Lib from "metabase-lib";

import { FilterOperatorPicker } from "../FilterOperatorPicker";
import { FilterTitle, HoverParent } from "../FilterTitle";
import { useFilterModalContext } from "../context";
import type { FilterEditorProps } from "../types";

export function BooleanFilterEditor({
  stageIndex,
  column,
  filter,
  onChange,
}: FilterEditorProps) {
  const { query } = useFilterModalContext();
  const columnIcon = useMemo(() => getColumnIcon(column), [column]);

  const {
    operator,
    availableOptions,
    values,
    valueCount,
    isExpanded,
    getDefaultValues,
    getFilterClause,
    setOperator,
    setValues,
  } = useBooleanOperatorFilter({
    query,
    stageIndex,
    column,
    filter,
  });

  const handleOperatorChange = (newOperator: Lib.BooleanFilterOperator) => {
    const newValues = getDefaultValues();
    setOperator(newOperator);
    setValues(newValues);
    onChange(getFilterClause(newOperator, newValues));
  };

  const handleValuesChange = (newValues: boolean[]) => {
    const newOperator = "=";
    setOperator(newOperator);
    setValues(newValues);
    onChange(getFilterClause(newOperator, newValues));
  };

  return (
    <HoverParent data-testid="boolean-filter-editor">
      <Grid grow>
        <Grid.Col span="auto">
          <FilterTitle
            stageIndex={stageIndex}
            column={column}
            columnIcon={columnIcon}
          >
            {isExpanded && (
              <FilterOperatorPicker
                value={operator}
                options={availableOptions}
                onChange={handleOperatorChange}
              />
            )}
          </FilterTitle>
        </Grid.Col>
        <Grid.Col span={4}>
          <Group gap="md">
            <Checkbox
              label={t`True`}
              checked={values.length > 0 ? values[0] : false}
              indeterminate={valueCount === 0}
              onChange={event =>
                handleValuesChange(event.target.checked ? [true] : [])
              }
            />
            <Checkbox
              label={t`False`}
              checked={values.length > 0 ? !values[0] : false}
              indeterminate={valueCount === 0}
              onChange={event =>
                handleValuesChange(event.target.checked ? [false] : [])
              }
            />
          </Group>
        </Grid.Col>
      </Grid>
    </HoverParent>
  );
}
