import {
    assertUnreachable,
    ChartKind,
    DimensionType,
    FieldType,
    SemanticLayerFieldType,
    type ResultRow,
    type SemanticLayerField,
    type SemanticLayerSortBy,
    type SemanticLayerTimeDimension,
    type SqlTableConfig,
    type VizSqlColumn,
} from '@lightdash/common';
import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

export enum EditorTabs {
    SQL = 'sql',
    VISUALIZATION = 'visualization',
}

export enum SidebarTabs {
    TABLES = 'tables',
    VISUALIZATION = 'visualization',
}
type SemanticLayerStatePayloadDimension = Pick<
    SemanticLayerField,
    'name' | 'kind' | 'type'
>;
type SemanticLayerStatePayloadTimeDimension = Pick<
    SemanticLayerTimeDimension,
    'name' | 'kind' | 'type' | 'granularity'
>;
type SemanticLayerStatePayloadMetric = Pick<
    SemanticLayerField,
    'name' | 'kind' | 'type'
>;

type SemanticLayerStatePayloadField =
    | SemanticLayerStatePayloadDimension
    | SemanticLayerStatePayloadTimeDimension
    | SemanticLayerStatePayloadMetric;

type SemanticLayerStateDimension = Pick<SemanticLayerField, 'name'>;
type SemanticLayerStateMetric = Pick<SemanticLayerField, 'name'>;
type SemanticLayerStateTimeDimension = Pick<
    SemanticLayerTimeDimension,
    'name' | 'granularity'
>;

type SemanticLayerStateField =
    | SemanticLayerStateDimension
    | SemanticLayerStateMetric
    | SemanticLayerStateTimeDimension;

export interface SemanticViewerState {
    projectUuid: string;

    view: string | undefined;
    activeEditorTab: EditorTabs;
    activeSidebarTab: SidebarTabs;
    selectedChartType: ChartKind | undefined;

    resultsTableConfig: SqlTableConfig | undefined;

    results: ResultRow[];
    columns: VizSqlColumn[];

    selectedDimensions: Record<string, SemanticLayerStateDimension>;
    selectedTimeDimensions: Record<string, SemanticLayerStateTimeDimension>;
    selectedMetrics: Record<string, SemanticLayerStateMetric>;

    limit: number | undefined;

    sortBy: SemanticLayerSortBy[];
}

export const isSemanticLayerStateTimeDimension = (
    field: SemanticLayerStateField,
): field is SemanticLayerStateTimeDimension => {
    return 'granularity' in field;
};

const initialState: SemanticViewerState = {
    projectUuid: '',
    activeEditorTab: EditorTabs.VISUALIZATION,
    activeSidebarTab: SidebarTabs.TABLES,
    selectedChartType: ChartKind.TABLE,
    resultsTableConfig: undefined,

    view: undefined,

    selectedDimensions: {},
    selectedMetrics: {},
    selectedTimeDimensions: {},

    results: [],
    columns: [],
    limit: undefined,

    sortBy: [],
};
const getKeyByField = (
    field:
        | Pick<SemanticLayerField, 'name' | 'kind' | 'type'>
        | Pick<
              SemanticLayerTimeDimension,
              'name' | 'kind' | 'type' | 'granularity'
          >,
): 'selectedDimensions' | 'selectedTimeDimensions' | 'selectedMetrics' => {
    switch (field.kind) {
        case FieldType.DIMENSION:
            switch (field.type) {
                case SemanticLayerFieldType.TIME:
                    return 'selectedTimeDimensions';
                case SemanticLayerFieldType.STRING:
                case SemanticLayerFieldType.NUMBER:
                case SemanticLayerFieldType.BOOLEAN:
                    return 'selectedDimensions';
                default:
                    return assertUnreachable(
                        field.type,
                        `Unknown field type: ${field.type}`,
                    );
            }
        case FieldType.METRIC:
            return 'selectedMetrics';
        default:
            return assertUnreachable(
                field.kind,
                `Unknown field kind: ${field.kind}`,
            );
    }
};

function getDimensionTypeFromSemanticLayerFieldType(
    type: SemanticLayerFieldType,
): DimensionType {
    switch (type) {
        case SemanticLayerFieldType.TIME:
            return DimensionType.TIMESTAMP;
        case SemanticLayerFieldType.STRING:
            return DimensionType.STRING;
        case SemanticLayerFieldType.NUMBER:
            return DimensionType.NUMBER;
        case SemanticLayerFieldType.BOOLEAN:
            return DimensionType.BOOLEAN;
        default:
            return assertUnreachable(type, `Unknown field type: ${type}`);
    }
}

export type ResultsAndColumns = {
    results: ResultRow[];
    columns: VizSqlColumn[];
    sortBy: [];
};

export const semanticViewerSlice = createSlice({
    name: 'semanticViewer',
    initialState,
    reducers: {
        resetState: () => {
            return initialState;
        },
        setProjectUuid: (state, action: PayloadAction<string>) => {
            state.projectUuid = action.payload;
        },
        enterView: (state, action: PayloadAction<string>) => {
            state.view = action.payload;
        },
        setResults: (
            state,
            action: PayloadAction<{
                results: ResultRow[];
                columns: VizSqlColumn[];
            }>,
        ) => {
            state.results = action.payload.results || [];
        },

        selectField: (
            state,
            action: PayloadAction<SemanticLayerStatePayloadField>,
        ) => {
            const key = getKeyByField(action.payload);
            state[key][action.payload.name] = action.payload;
        },
        deselectField: (
            state,
            action: PayloadAction<SemanticLayerStatePayloadField>,
        ) => {
            const key = getKeyByField(action.payload);
            delete state[key][action.payload.name];
        },
        updateTimeDimensionGranularity: (
            state,
            action: PayloadAction<SemanticLayerStatePayloadTimeDimension>,
        ) => {
            const key = getKeyByField(action.payload);
            state[key][action.payload.name] = action.payload;
        },

        setActiveEditorTab: (state, action: PayloadAction<EditorTabs>) => {
            state.activeEditorTab = action.payload;
            if (action.payload === EditorTabs.VISUALIZATION) {
                state.activeSidebarTab = SidebarTabs.VISUALIZATION;
                if (state.selectedChartType === undefined) {
                    state.selectedChartType = ChartKind.VERTICAL_BAR;
                }
            }
            if (action.payload === EditorTabs.SQL) {
                state.activeSidebarTab = SidebarTabs.TABLES;
            }
        },

        setSavedChartData: (state, action: PayloadAction<any>) => {
            console.debug('setSavedChartData state', state, action);
            throw new Error('Not implemented');
            /*state.savedSqlChart = action.payload;
            state.name = action.payload.name;
            state.description = action.payload.description || '';
            state.sql = action.payload.sql;
            state.limit = action.payload.limit || 500;
            state.selectedChartType =
                action.payload.config.type || ChartKind.VERTICAL_BAR;*/
        },
        setSelectedChartType: (state, action: PayloadAction<ChartKind>) => {
            state.selectedChartType = action.payload;
        },
        setFields: (state, action: PayloadAction<SemanticLayerField[]>) => {
            const sqlColumns: VizSqlColumn[] = action.payload.map((field) => ({
                reference: field.name,
                type: getDimensionTypeFromSemanticLayerFieldType(field.type),
            }));

            state.columns = sqlColumns;
        },
    },
});

export const {
    resetState,
    setProjectUuid,
    enterView,
    setResults,
    setActiveEditorTab,
    setSelectedChartType,
    setFields,
    selectField,
    deselectField,
    updateTimeDimensionGranularity,
} = semanticViewerSlice.actions;
