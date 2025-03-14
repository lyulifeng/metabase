import { useMemo } from "react";

import { getColumnIcon } from "metabase/common/utils/columns";
import {
  type OperatorOption,
  useDefaultFilter,
} from "metabase/querying/filters/hooks/use-default-filter";
import { Checkbox, Grid, Group } from "metabase/ui";

import { FilterTitle, HoverParent } from "../FilterTitle";
import { useFilterModalContext } from "../context";
import type { FilterEditorProps } from "../types";

export function DefaultFilterEditor({
  stageIndex,
  column,
  filter,
  onChange,
}: FilterEditorProps) {
  const { query } = useFilterModalContext();
  const columnIcon = useMemo(() => {
    return getColumnIcon(column);
  }, [column]);

  const { operator, availableOptions, getFilterClause, setOperator } =
    useDefaultFilter({
      query,
      stageIndex,
      column,
      filter,
    });

  const handleOperatorChange = (option: OperatorOption, isChecked: boolean) => {
    const newOperator = isChecked ? option.operator : undefined;
    setOperator(newOperator);
    onChange(getFilterClause(newOperator));
  };

  return (
    <HoverParent data-testid="default-filter-editor">
      <Grid grow>
        <Grid.Col span="auto">
          <FilterTitle
            stageIndex={stageIndex}
            column={column}
            columnIcon={columnIcon}
          />
        </Grid.Col>
        <Grid.Col span={4}>
          <Group gap="md">
            {availableOptions.map(option => (
              <Checkbox
                key={option.operator}
                label={option.name}
                checked={option.operator === operator}
                onChange={event =>
                  handleOperatorChange(option, event.target.checked)
                }
              />
            ))}
          </Group>
        </Grid.Col>
      </Grid>
    </HoverParent>
  );
}
