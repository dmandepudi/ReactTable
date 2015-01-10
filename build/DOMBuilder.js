/** @jsx React.DOM */
/* Virtual DOM builder helpers */

function buildCustomMenuItems(table, columnDef) {
    var menuItems = [];
    var popupStyle = {
        "position": "absolute",
        "top": "-50%",
        "whiteSpace": "normal",
        "width": "250px"
    };
    for( var menuItemTitle in table.props.customMenuItems ){
        for( var menuItemType in table.props.customMenuItems[menuItemTitle] ){
            if( menuItemType == "infoBox" ){
                if( columnDef[table.props.customMenuItems[menuItemTitle][menuItemType]] ) {
                    var direction = table.state.columnDefs.indexOf(columnDef)*10/table.state.columnDefs.length > 5 ?
                            "right" : "left";
                    var styles = {};
                    for(var k in popupStyle) styles[k]=popupStyle[k];
                    styles[direction] = "100%";
                    menuItems.push(
                        React.createElement("div", {style: {"position": "relative"}, className: "menu-item menu-item-hoverable"}, 
                            React.createElement("div", null, menuItemTitle), 
                            React.createElement("div", {className: "menu-item-input", style: styles}, 
                                React.createElement("div", {style: {"display": "block"}}, 
                                    columnDef[table.props.customMenuItems[menuItemTitle][menuItemType]]
                                )
                            )
                        )
                    );
                }
            }
        }
    }

    return menuItems;

    // onClick={table.handleInfoBoxPopup.bind(columnDef[table.props.customMenuItems[menuItemTitle][menuItemType]])}>

    //var menuItems = [];
    //if (columnDef.customMenuItems) {
    //    menuItems.push(<div className="separator"/>, columnDef.customMenuItems(table, columnDef));
    //}
    //return menuItems;
}



function buildMenu(options) {
    var table = options.table,
        columnDef = options.columnDef,
        style = options.style,
        isFirstColumn = options.isFirstColumn, menuStyle = {};

    if (style.textAlign == 'right')
        menuStyle.right = "0%";
    else
        menuStyle.left = "0%";

    var summarizeMenuItem = React.createElement(SummarizeControl, {table: table, columnDef: columnDef});

    // construct user custom menu items
    var customMenuItems = buildCustomMenuItems(table, columnDef);

    var menuItems = [
        React.createElement("div", {className: "menu-item", onClick: table.handleSort.bind(null, columnDef, true)}, "Sort Asc"),
        React.createElement("div", {className: "menu-item", onClick: table.handleSort.bind(null, columnDef, false)}, "Sort Dsc"),
        summarizeMenuItem,
        React.createElement("div", {className: "menu-item", onClick: table.handleGroupBy.bind(null, null)}, "Clear Summary")
    ];

    if (isFirstColumn) {
        menuItems.push(React.createElement("div", {className: "separator"}));
        menuItems.push(React.createElement("div", {className: "menu-item", onClick: table.handleCollapseAll.bind(null, null)}, "Collapse All"));
        menuItems.push(React.createElement("div", {className: "menu-item", onClick: table.handleExpandAll.bind(null)}, "Expand All"));
    } else
        menuItems.push(React.createElement("div", {className: "menu-item", onClick: table.handleRemove.bind(null, columnDef)}, "Remove Column"));
    menuItems.push(customMenuItems);
    return (
        React.createElement("div", {style: menuStyle, className: "rt-header-menu"}, 
            menuItems
        )
    );
}

function buildHeaders(table) {
    var columnDef = table.state.columnDefs[0], i, style = {};
    var firstColumn = (
        React.createElement("div", {className: "rt-headers-container"}, 
            React.createElement("div", {style: {textAlign: "center"}, className: "rt-header-element", key: columnDef.colTag}, 
                React.createElement("a", {className: "btn-link rt-header-anchor-text"}, table.state.firstColumnLabel.join("/"))
            ), 
            React.createElement("div", {className: "rt-caret-container"}, 
                table.state.sortAsc != undefined && table.state.sortAsc === true &&
                            columnDef === table.state.columnDefSorted ? React.createElement("div", {className: "rt-upward-caret"}) : null, 
                table.state.sortAsc != undefined && table.state.sortAsc === false &&
                            columnDef === table.state.columnDefSorted ? React.createElement("div", {className: "rt-downward-caret"}) : null
            ), 
            buildMenu({table: table, columnDef: columnDef, style: {textAlign: "left"}, isFirstColumn: true})
        )
    );
    var headerColumns = [firstColumn];
    for (i = 1; i < table.state.columnDefs.length; i++) {
        columnDef = table.state.columnDefs[i];
        style = {textAlign: "center"};
        headerColumns.push(
            React.createElement("div", {className: "rt-headers-container"}, 
                React.createElement("div", {style: style, className: "rt-header-element rt-info-header", key: columnDef.colTag}, 
                    React.createElement("a", {className: "btn-link rt-header-anchor-text"}, columnDef.text)
                ), 
                React.createElement("div", {className: "rt-caret-container"}, 
                    table.state.sortAsc != undefined && table.state.sortAsc === true &&
                            columnDef === table.state.columnDefSorted ? React.createElement("div", {className: "rt-upward-caret"}) : null, 
                    table.state.sortAsc != undefined && table.state.sortAsc === false &&
                            columnDef === table.state.columnDefSorted ? React.createElement("div", {className: "rt-downward-caret"}) : null
                ), 
                buildMenu({table: table, columnDef: columnDef, style: style, isFirstColumn: false})
            )
        );
    }
    // the plus sign at the end
    headerColumns.push(
        React.createElement("span", {className: "rt-header-element rt-add-column", style: {"textAlign": "center"}}, 
            React.createElement("a", {className: "btn-link rt-plus-sign", onClick: table.handleAdd}, 
                React.createElement("strong", null, "+")
            )
        ));
    return (
        React.createElement("div", {className: "rt-headers-grand-container"}, 
            React.createElement("div", {key: "header", className: "rt-headers"}, 
                headerColumns
            )
        )
    );
}

function buildFirstCellForRow(props) {
    var data = props.data, columnDef = props.columnDefs[0], toggleHide = props.toggleHide;
    var firstColTag = columnDef.colTag, userDefinedElement, result;

    // if sectorPath is not available - return a normal cell
    if (!data.sectorPath)
        return React.createElement("td", {key: firstColTag}, data[firstColTag]);

    // styling & ident
    var identLevel = !data.isDetail ? data.sectorPath.length - 1 : data.sectorPath.length;
    var firstCellStyle = {
        "paddingLeft": (10 + identLevel * 25) + "px"
    };

    userDefinedElement = (!data.isDetail && columnDef.summaryTemplate) ? columnDef.summaryTemplate.call(null, data) : null;

    if (data.isDetail)
        result = React.createElement("td", {style: firstCellStyle, key: firstColTag}, data[firstColTag]);
    else {
        result =
            (
                React.createElement("td", {style: firstCellStyle, key: firstColTag}, 
                    React.createElement("a", {onClick: toggleHide.bind(null, data), className: "btn-link"}, 
                        React.createElement("strong", null, data[firstColTag])
                    ), 
                    userDefinedElement
                )
            );
    }
    return result;
}

function buildFooter(table, paginationAttr) {
    return table.props.columnDefs.length > 0 ?
        (React.createElement(PageNavigator, {
            items: paginationAttr.allPages.slice(paginationAttr.pageDisplayRange.start, paginationAttr.pageDisplayRange.end), 
            activeItem: table.state.currentPage, 
            numPages: paginationAttr.pageEnd, 
            handleClick: table.handlePageClick})) : null;
}