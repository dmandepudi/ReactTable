/** @jsx React.DOM */

/**
 * High Level TODOs
 * TODO add sortIndex to custom numerical buckets so they sort correctly
 */

/**
 * The core data is represented as a multi-node tree structure, where each node on the tree represents a 'sector'
 * and can refer to children 'sectors'
 * @author Erfang Chen
 */
var idCounter = 0;
var SECTOR_SEPARATOR = "#";

function isRowSelected(row, rowKey, selectedDetailRows, selectedSummaryRows) {
    if (rowKey == null)
        return;
    return selectedDetailRows[row[rowKey]] != null || (!row.isDetail && selectedSummaryRows[generateSectorKey(row.sectorPath)] != null);
}

var ReactTable = React.createClass({

    getInitialState: ReactTableGetInitialState,

    /* --- Called by component or child react components --- */
    handleSort: ReactTableHandleSort,
    handleAdd: ReactTableHandleAdd,
    handleRemove: ReactTableHandleRemove,
    handleToggleHide: ReactTableHandleToggleHide,
    handleGroupBy: ReactTableHandleGroupBy,
    handlePageClick: ReactTableHandlePageClick,
    handleSelect: ReactTableHandleSelect,
    handleCollapseAll: function () {
        var rootNode = this.state.rootNode;
        rootNode.collapseImmediateChildren();
        this.setState({rootNode: rootNode, currentPage: 1});
    },
    handleExpandAll: function () {
        var rootNode = this.state.rootNode;
        rootNode.expandRecursively();
        this.setState({rootNode: rootNode, currentPage: 1});
    },
    /* -------------------------------------------------- */

    toggleSelectDetailRow: function (key) {
        var selectedDetailRows = this.state.selectedDetailRows, state;
        if (selectedDetailRows[key] != null) {
            delete selectedDetailRows[key];
            state = false;
        }
        else {
            selectedDetailRows[key] = 1;
            state = true;
        }
        this.setState({
            selectedDetailRows: selectedDetailRows
        });
        return state;
    },
    toggleSelectSummaryRow: function (key) {
        var selectedSummaryRows = this.state.selectedSummaryRows, state;
        if (selectedSummaryRows[key] != null) {
            delete selectedSummaryRows[key];
            state = false;
        } else {
            selectedSummaryRows[key] = 1;
            state = true;
        }
        this.setState({
            selectedDetailRows: selectedSummaryRows
        });
        return state;
    },

    /* --- Called from outside the component --- */
    addColumn: function (columnDef, data) {
        this.state.columnDefs.push(columnDef);
        if (data) {
            this.props.data = data;
            this.state.rootNode = createTree(this.props);
        }
        this.setState({rootNode: this.state.rootNode});
    },
    replaceData: function (data) {
        this.props.data = data;
        var rootNode = createTree(this.props);
        this.setState({
            rootNode: rootNode,
            currentPage: 1
        });
    },
    /* ----------------------------------------- */

    componentDidMount: function () {
        setTimeout(function () {
            adjustHeaders.call(this);
        }.bind(this));
        document.addEventListener('click', adjustHeaders.bind(this));
        window.addEventListener('resize', adjustHeaders.bind(this));
        var $node = $(this.getDOMNode());
        $node.find(".rt-scrollable").bind('scroll', function () {
            $node.find(".rt-headers").css({'overflow': 'auto'}).scrollLeft($(this).scrollLeft());
            $node.find(".rt-headers").css({'overflow': 'hidden'});
        });
        bindHeadersToMenu($node);
    },
    componentWillUnmount: function () {
        window.removeEventListener('resize', adjustHeaders.bind(this));
    },
    componentDidUpdate: function () {
        adjustHeaders.call(this);
        bindHeadersToMenu($(this.getDOMNode()));
    },
    render: function () {
        var rasterizedData = rasterizeTree({
            node: this.state.rootNode,
            firstColumn: this.state.columnDefs[0],
            selectedDetailRows: this.state.selectedDetailRows
        });

        var paginationAttr = getPageArithmetics(this, rasterizedData);
        var rowsToDisplay = rasterizedData.slice(paginationAttr.lowerVisualBound, paginationAttr.upperVisualBound + 1);

        var rows = rowsToDisplay.map(function (row) {
            var rowKey = this.props.rowKey;
            return (<Row
                data={row}
                isSelected={isRowSelected(row, this.props.rowKey, this.state.selectedDetailRows, this.state.selectedSummaryRows)}
                onSelect={this.handleSelect}
                key={generateRowKey(row, rowKey)}
                columnDefs={this.state.columnDefs}
                toggleHide={this.handleToggleHide}/>);
        }, this);

        var headers = buildHeaders(this);
        var footer = buildFooter(this, paginationAttr);

        var containerStyle = {};
        if (this.state.height && parseInt(this.state.height) > 0)
            containerStyle.height = this.state.height;

        return (
            <div id={this.state.uniqueId} className="rt-table-container">
                {headers}
                <div style={containerStyle} className="rt-scrollable">
                    <table className="rt-table">
                        <tbody>
                        {rows}
                        </tbody>
                    </table>
                </div>
                {footer}
            </div>
        );
    }
});

var Row = React.createClass({
    render: function () {
        var cells = [buildFirstCellForRow(this.props)];
        for (var i = 1; i < this.props.columnDefs.length; i++) {
            var columnDef = this.props.columnDefs[i];
            var lookAndFeel = buildCellLookAndFeel(columnDef, this.props.data);
            var cx = React.addons.classSet;
            var classes = cx(lookAndFeel.classes);
            cells.push(
                <td
                    className={classes}
                    style={lookAndFeel.styles}
                    key={columnDef.colTag}>
                    {lookAndFeel.value}
                </td>
            );
        }
        var cx = React.addons.classSet;
        var classes = cx({
            'selected': this.props.isSelected && this.props.data.isDetail,
            'summary-selected': this.props.isSelected && !this.props.data.isDetail
        });
        var styles = {
            "cursor": this.props.data.isDetail ? "pointer" : "inherit"
        };
        return (<tr onClick={this.props.onSelect.bind(null, this.props.data)} className={classes} style={styles}>{cells}</tr>);
    }
});
var PageNavigator = React.createClass({
    handleClick: function (index, event) {
        event.preventDefault();
        if (index <= this.props.numPages && index >= 1)
            this.props.handleClick(index);
    },
    render: function () {
        var self = this;
        var cx = React.addons.classSet;
        var prevClass = cx({
            disabled: (this.props.activeItem == 1)
        });
        var nextClass = cx({
            disabled: (this.props.activeItem == this.props.numPages)
        });

        var items = this.props.items.map(function (item) {
            return (
                <li key={item} className={self.props.activeItem == item ? 'active' : ''}>
                    <a href="#" onClick={self.handleClick.bind(null, item)}>{item}</a>
                </li>
            )
        });
        return (
            <ul className={prevClass} className="pagination pull-right">
                <li className={nextClass}>
                    <a className={prevClass} href="#" onClick={this.props.handleClick.bind(null, this.props.activeItem - 1)}>&laquo;</a>
                </li>
                {items}
                <li className={nextClass}>
                    <a className={nextClass} href="#" onClick={this.props.handleClick.bind(null, this.props.activeItem + 1)}>&raquo;</a>
                </li>
            </ul>
        );
    }
});
var SummarizeControl = React.createClass({
    getInitialState: function () {
        return {
            userInputBuckets: ""
        }
    },
    handleChange: function (event) {
        this.setState({userInputBuckets: event.target.value});
    },
    render: function () {
        var table = this.props.table, columnDef = this.props.columnDef;
        var subMenuAttachment = columnDef.format == "number" || columnDef.format == "currency" ?
            (
                <div className="menu-item-input" onHover style={{"position": "absolute", "top": "0%", "left": "100%"}}>
                    <label>Enter Bucket(s)</label>
                    <input onChange={this.handleChange} placeholder="ex: 1,10,15"/>
                    <a onClick={table.handleGroupBy.bind(null, columnDef, this.state.userInputBuckets)} className="btn-link">Ok</a>
                </div>
            ) : null;
        return (
            <div
                onClick={subMenuAttachment == null ? table.handleGroupBy.bind(null, columnDef, null) : function () {
                } }
                style={{"position": "relative"}} className="menu-item menu-item-hoverable">
                <div>Summarize</div>
                {subMenuAttachment}
            </div>
        );
    }
});

/*
 * ----------------------------------------------------------------------
 * Public Helpers / Utilities
 * ----------------------------------------------------------------------
 */

function generateSectorKey(sectorPath) {
    if (sectorPath == null)
        return "";
    return sectorPath.join(SECTOR_SEPARATOR);
}

function generateRowKey(row, rowKey) {
    var key;
    if (!row.isDetail) {
        key = generateSectorKey(row.sectorPath);
    }
    else if (rowKey)
        key = row[rowKey];
    else {
        key = row.rowCount;
    }
    return key;
}

function computePageDisplayRange(currentPage, maxDisplayedPages) {
    // total number to allocate
    var displayUnitsLeft = maxDisplayedPages;
    // allocate to the left
    var leftAllocation = Math.min(Math.floor(displayUnitsLeft / 2), currentPage - 1);
    var rightAllocation = displayUnitsLeft - leftAllocation;
    return {
        start: currentPage - leftAllocation - 1,
        end: currentPage + rightAllocation - 1
    }
}

function adjustHeaders() {
    var id = this.state.uniqueId;
    var adjustedWideHeaders = false;
    var counter = 0;
    var headerElems = $("#" + id + " .rt-headers-container");
    var padding = parseInt(headerElems.first().find(".rt-header-element").css("padding-left"));
    padding += parseInt(headerElems.first().find(".rt-header-element").css("padding-right"));
    headerElems.each(function () {
        var currentHeader = $(this);
        var width = $('#' + id + ' .rt-table tr:first td:eq(' + counter + ')').outerWidth() - 1;
        if (counter == 0 && parseInt(headerElems.first().css("border-right")) == 1) {
            width += 1;
        }
        var headerTextWidthWithPadding = currentHeader.find(".rt-header-anchor-text").width() + padding;
        if (currentHeader.width() > 0 && headerTextWidthWithPadding > currentHeader.width() + 1) {
            $(this).width(headerTextWidthWithPadding);
            $("#" + id).find("tr").find("td:eq(" + counter + ")").css("min-width", (headerTextWidthWithPadding) + "px");
            adjustedWideHeaders = true;
        }
        currentHeader.width(width);
        counter++;
    });
    if (adjustedWideHeaders) {
        adjustHeaders.call(this);
    }
}

function getPageArithmetics(table, data) {
    var result = {};
    result.pageSize = table.props.pageSize || 50;
    result.maxDisplayedPages = table.props.maxDisplayedPages || 10;

    result.pageStart = 1;
    result.pageEnd = Math.ceil(data.length / result.pageSize);

    result.allPages = [];
    for (var i = result.pageStart; i <= result.pageEnd; i++) {
        result.allPages.push(i);
    }
    // derive the correct page navigator selectable pages from current / total pages
    result.pageDisplayRange = computePageDisplayRange(table.state.currentPage, result.maxDisplayedPages);

    result.lowerVisualBound = (table.state.currentPage - 1) * result.pageSize;
    result.upperVisualBound = Math.min(table.state.currentPage * result.pageSize - 1, data.length);

    return result;

}

function bindHeadersToMenu(node) {
    node.find(".rt-headers-container").each(function () {
        var headerContainer = this;
        $(headerContainer).hover(function () {
            var headerPosition = $(headerContainer).position();
            if (headerPosition.left) {
                $(headerContainer).find(".rt-header-menu").css("left", headerPosition.left + "px");
            }
            if (headerPosition.right) {
                $(headerContainer).find(".rt-header-menu").css("right", headerPosition.right + "px");
            }
        });
    });
}

function uniqueId(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
};