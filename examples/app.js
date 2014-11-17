$(function () {
    var columnDefs = [
        {colTag: "first_name", text: "First Name"},
        {
            colTag: "last_name", text: "Last Name", customMenuItems: function (table, columnDef) {
            return [React.createElement(SummarizeControl, {table: table, columnDef: columnDef})];
        }
        },
        {colTag: "email", text: "Email"},
        {
            colTag: "nationality", text: "Nationality",
            sort: function (a, b) {
                return a.country.localeCompare(b.country);
            }
        },
        {
            colTag: "superlong",
            text: "This is a super super long column header name - trust me"
        },
        {
            colTag: "test_score",
            format: "number",
            formatInstructions: "multiplier:1 roundTo:0 unit:%",
            text: "Test Score",
            groupByRange: [0, 25, 50, 100],
            aggregationMethod: "average",
            weightBy: {colTag: "score_weight_factor"},
            cellClassCallback: function (row) {
                var classes = {green: false, red: false};
                classes.green = row.test_score > 50 ? true : false;
                classes.red = row.test_score <= 50 ? true : false;
                return classes;
            }
        },
        {colTag: "fruit_preference", text: "Fruit Preference"},
        {
            colTag: "score_weight_factor",
            format: "number",
            formatInstructions: "multiplier:1000 separator:true",
            text: "Weight Factor",
            aggregationMethod: "sum"
        }
        //,
        //{
        //    colTag: "abcd",
        //    text: "This is a really really long header name wow look how long this is"
        //}
    ];
    var columnDefs2 = [
        {colTag: "first_name", text: "First Name"},
        {colTag: "last_name", text: "Last Name", aggregationMethod: "count_distinct"},
        {colTag: "email", text: "Email"},
        {
            colTag: "test_score",
            format: "number",
            groupByRange: [0, 10, 25, 30, 50, 100],
            formatInstructions: "multiplier:1 roundTo:0 unit:%",
            text: "Test Score",
            aggregationMethod: "average",
            conditionalAggregationMethod: {"fruit_preference": "count"},
            weightBy: {colTag: "score_weight_factor"}
        },
        {colTag: "fruit_preference", text: "Fruit Preference"},
        {colTag: "score_weight_factor", format: "currency", text: "Weight Factor", aggregationMethod: "sum"}
    ];

    $.get('sample_data.json').success(function (data) {
        var testData = data;
        // first table
        var groupBy = [{colTag: "nationality"}, {colTag: "fruit_preference"}];
        var options = {
            groupBy: groupBy,
            rowKey: 'id',
            data: testData,
            height: "300px",
            columnDefs: columnDefs,
            beforeColumnAdd: function () {
                console.log("beforeColumnAdd callback called!");
                addMe();
            },
            afterColumnRemove: function (a, b) {
                console.log("Hello There ... you tried to remove " + b.text);
            },
            onSelectCallback: function (row, state) {
                console.log("id = " + row.id + " clicked state:" + state);
            },
            onsummarySelectCallback: function (result, state) {
                console.log(result.summaryRow);
                console.log("Includes " + result.detailRows.length + " detail rows! state:" + state);
            }
        };
        var table1 = React.render(React.createElement(ReactTable, options), document.getElementById("table"));

        function addMe() {
            table1.addColumn({colTag: "currency_used", text: "Currency used"});
        }

        // second table
        var options2 = {
            rowKey: 'id',
            data: testData,
            columnDefs: columnDefs2,
            onSelectCallback: function (row) {
                console.log("id = " + row.id + " clicked");
            },
            beforeColumnAdd: function () {
                console.log("beforeColumnAdd callback called!");
            },
            afterColumnRemove: function (a, b) {
                console.log("Hello There ... you tried to remove " + b.text);
            }
        }
        React.render(React.createElement(ReactTable, options2), document.getElementById("table2"));
    })
})