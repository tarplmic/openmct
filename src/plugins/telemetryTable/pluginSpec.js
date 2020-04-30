/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import TablePlugin from './plugin.js';
import Vue from 'vue';
import {
    createOpenMct,
    createMouseEvent,
    spyOnBuiltins,
    clearBuiltinSpies
} from 'testTools';

let openmct;
let tablePlugin;
let element;
let child;

describe("the plugin", () => {
    beforeEach((done) => {
        const appHolder = document.createElement('div');
        appHolder.style.width = '640px';
        appHolder.style.height = '480px';

        openmct = createOpenMct();

        element = document.createElement('div');
        child = document.createElement('div');
        element.appendChild(child);

        tablePlugin = new TablePlugin();
        openmct.install(tablePlugin);

        openmct.install(openmct.plugins.UTCTimeSystem());
        openmct.time.timeSystem('utc', {start: 0, end: 3});

        spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([]));

        spyOnBuiltins(['requestAnimationFrame']);
        window.requestAnimationFrame.and.callFake((callBack) => {
            callBack();
        });

        openmct.on('start', done);
        openmct.start(appHolder);
    });

    afterEach(() => {
        clearBuiltinSpies();
    });

    it("provides a table view for objects with telemetry", () => {
        const testTelemetryObject = {
            id:"test-object",
            type: "test-object",
            telemetry: {
                values: [{
                    key: "some-key"
                }]
            }
        };

        const applicableViews = openmct.objectViews.get(testTelemetryObject);
        let tableView = applicableViews.find((viewProvider) => viewProvider.key === 'table');
        expect(tableView).toBeDefined();
    });

    describe("The table view", () => {
        let testTelemetryObject;
        let applicableViews;
        let tableViewProvider;
        let tableView;

        beforeEach(() => {
            testTelemetryObject = {
                identifier:{ namespace: "", key: "test-object"},
                type: "test-object",
                name: "Test Object",
                telemetry: {
                    values: [{
                        key: "utc",
                        format: "utc",
                        name: "Time",
                        hints: {
                            domain: 1
                        }
                    },{
                        key: "some-key",
                        name: "Some attribute",
                        hints: {
                            range: 1
                        }
                    }, {
                        key: "some-other-key",
                        name: "Another attribute",
                        hints: {
                            range: 2
                        }
                    }]
                }
            };
            const testTelemetry = [
                {
                    'utc': 1,
                    'some-key': 'some-value 1',
                    'some-other-key' : 'some-other-value 1'
                },
                {
                    'utc': 2,
                    'some-key': 'some-value 2',
                    'some-other-key' : 'some-other-value 2'
                }
            ];
            let telemetryRequestPromise = Promise.resolve(testTelemetry);
            openmct.telemetry.request.and.returnValue(telemetryRequestPromise);

            applicableViews = openmct.objectViews.get(testTelemetryObject);
            tableViewProvider = applicableViews.find((viewProvider) => viewProvider.key === 'table');
            tableView = tableViewProvider.view(testTelemetryObject, [testTelemetryObject]);
            tableView.show(child, true);

            return telemetryRequestPromise.then(() => Vue.nextTick());
        });

        it("Renders a row for every telemetry datum returned",() => {
            let rows = element.querySelectorAll('table.c-telemetry-table__body tr');
            expect(rows.length).toBe(2);
        });


        it("Renders a column for every item in telemetry metadata",() => {
            let headers = element.querySelectorAll('span.c-telemetry-table__headers__label');
            expect(headers.length).toBe(3);
            expect(headers[0].innerText).toBe('Time');
            expect(headers[1].innerText).toBe('Some attribute');
            expect(headers[2].innerText).toBe('Another attribute');
        });

        it("Supports column reordering via drag and drop",() => {
            let columns = element.querySelectorAll('tr.c-telemetry-table__headers__labels th');
            let fromColumn = columns[0];
            let toColumn = columns[1];
            let fromColumnText = fromColumn.querySelector('span.c-telemetry-table__headers__label').innerText;
            let toColumnText = toColumn.querySelector('span.c-telemetry-table__headers__label').innerText;

            let dragStartEvent = createMouseEvent('dragstart');
            let dragOverEvent = createMouseEvent('dragover');
            let dropEvent = createMouseEvent('drop');

            dragStartEvent.dataTransfer =
                dragOverEvent.dataTransfer =
                    dropEvent.dataTransfer = new DataTransfer();

            fromColumn.dispatchEvent(dragStartEvent);
            toColumn.dispatchEvent(dragOverEvent);
            toColumn.dispatchEvent(dropEvent);

            return Vue.nextTick().then(() => {
                columns = element.querySelectorAll('tr.c-telemetry-table__headers__labels th');
                let firstColumn = columns[0];
                let secondColumn = columns[1];
                let firstColumnText = firstColumn.querySelector('span.c-telemetry-table__headers__label').innerText;
                let secondColumnText = secondColumn.querySelector('span.c-telemetry-table__headers__label').innerText;

                expect(fromColumnText).not.toEqual(firstColumnText);
                expect(fromColumnText).toEqual(secondColumnText);
                expect(toColumnText).not.toEqual(secondColumnText);
                expect(toColumnText).toEqual(firstColumnText);
            });
        });
    });
});
