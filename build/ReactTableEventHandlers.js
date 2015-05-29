function ReactTableGetInitialState() {
    // the holy grail of table state - describes structure of the data contained within the table
    var rootNode = createTree(this.props);
    var selections = _getInitialSelections(this.props.selectedRows, this.props.selectedSummaryRows);
    return {
        rootNode: rootNode,
        uniqueId: uniqueId("table"),
        currentPage: 1,
        height: this.props.height,
        columnDefs: this.props.columnDefs,
        selectedDetailRows: selections.selectedDetailRows,
        selectedSummaryRows: selections.selectedSummaryRows,
        firstColumnLabel: _construct1StColumnLabel(this),
        extraStyle: {},
        rows: [],
        hasMoreRows: false,
        itemsPerScroll: this.props.itemsPerScroll ? this.props.itemsPerScroll : 100,
        filterInPlace: {}
    };
}

function ReactTableHandleSelect(selectedRow) {
    var rowKey = this.props.rowKey, state;
    if (rowKey == null)
        return;
    if (selectedRow.isDetail != null & selectedRow.isDetail == true) {
        state = this.toggleSelectDetailRow(selectedRow[rowKey]);
        this.props.onSelectCallback(selectedRow, state);
    } else {
        state = this.toggleSelectSummaryRow(generateSectorKey(selectedRow.sectorPath));
        this.props.onSummarySelectCallback(selectedRow, state);
    }
}

function ReactTableHandleSort(columnDefToSortBy, sortAsc) {
    var sortFn = getSortFunction(columnDefToSortBy).bind(columnDefToSortBy);
    var reverseSortFn = getReverseSortFunction(columnDefToSortBy).bind(columnDefToSortBy);
    this.state.rootNode.sortChildren({
        sortFn: sortFn,
        reverseSortFn: reverseSortFn,
        recursive: true,
        sortAsc: sortAsc
    });
    this.props.currentSortStates = [sortAsc ? sortFn : reverseSortFn];
    this.setState({rootNode: this.state.rootNode, sortAsc: sortAsc, columnDefSorted: columnDefToSortBy, filterInPlace: {}});
}

function ReactTableHandleAddSort(columnDefToSortBy, sortAsc) {
    if( !this.props.currentSortStates || this.props.currentSortStates.length == 0 ) {
        ReactTableHandleSort.bind(columnDefToSortBy, sortAsc);
        return;
    }
    var sortFn = getSortFunction(columnDefToSortBy).bind(columnDefToSortBy);
    var reverseSortFn = getReverseSortFunction(columnDefToSortBy).bind(columnDefToSortBy);
    this.state.rootNode.addSortToChildren({
        sortFn: sortFn,
        reverseSortFn: reverseSortFn,
        recursive: true,
        sortAsc: sortAsc,
        oldSortFns: this.props.currentSortStates
    });
    this.props.currentSortStates.push(sortAsc ? sortFn : reverseSortFn);
    this.setState({rootNode: this.state.rootNode, sortAsc: sortAsc, columnDefSorted: columnDefToSortBy, filterInPlace: {}});
}

function ReactTableHandleGroupBy(columnDef, buckets) {

    if (buckets != null && buckets != "" && columnDef)
        columnDef.groupByRange = _createFloatBuckets(buckets);
    if (columnDef != null) {
        this.props.groupBy = this.props.groupBy || [];
        this.props.groupBy.push(columnDef);
    } else
        this.props.groupBy = null;

    var rootNode = createTree(this.props);

    this.setState({
        rootNode: rootNode,
        currentPage: 1,
        firstColumnLabel: _construct1StColumnLabel(this)
    });

}

function ReactTableHandleAdd() {
    if (this.props.beforeColumnAdd)
        this.props.beforeColumnAdd(this);
}

function ReactTableHandleRemove(columnDefToRemove) {
    var loc = this.state.columnDefs.indexOf(columnDefToRemove);
    var newColumnDefs = [];
    for (var i = 0; i < this.state.columnDefs.length; i++) {
        if (i != loc)
            newColumnDefs.push(this.state.columnDefs[i]);
    }
    this.setState({
        columnDefs: newColumnDefs
    });
    // TODO pass copies of these variables to avoid unintentional perpetual binding
    if (this.props.afterColumnRemove != null)
        this.props.afterColumnRemove(newColumnDefs, columnDefToRemove);
}

function ReactTableHandleToggleHide(summaryRow, event) {
    event.stopPropagation();
    summaryRow.treeNode.collapsed = !summaryRow.treeNode.collapsed;
    this.setState({rootNode: this.state.rootNode});
}

function ReactTableHandlePageClick(page) {
    this.setState({
        currentPage: page
    });

}

/*
 * ----------------------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------------------
 */
function _createFloatBuckets(buckets) {
    var i = 0, stringBuckets, floatBuckets = [];
    stringBuckets = buckets.split(",");
    for (i = 0; i < stringBuckets.length; i++) {
        var floatBucket = parseFloat(stringBuckets[i]);
        if (!isNaN(floatBucket))
            floatBuckets.push(floatBucket);
        floatBuckets.sort(function (a,b) {
            return a - b;
        });
    }
    return floatBuckets;
}

function _construct1StColumnLabel(table) {
    var result = [];
    if (table.props.groupBy) {
        for (var i = 0; i < table.props.groupBy.length; i++)
            result.push(table.props.groupBy[i].text);
    }
    result.push(table.props.columnDefs[0].text);
    return result;
}

function _getInitialSelections(selectedRows, selectedSummaryRows) {
    var results = {selectedDetailRows: {}, selectedSummaryRows: {}};
    if (selectedRows != null) {
        for (var i = 0; i < selectedRows.length; i++)
            results.selectedDetailRows[selectedRows[i]] = 1;
    }
    if (selectedSummaryRows != null) {
        for (var i = 0; i < selectedSummaryRows.length; i++)
            results.selectedSummaryRows[selectedSummaryRows[i]] = 1;
    }
    return results;
}
