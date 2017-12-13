'use strict';

var docgen = require('./docgen');
var servicegen = require('./servicegen');
var prjgen = require('./prjgen');
var testgen = require('./testgen');

module.exports = {
    create: prjgen.create,
    add: servicegen.add,
    bulkAdd: servicegen.bulkAdd,
    test: testgen.update,
    docs: docgen.update
};