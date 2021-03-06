#!/usr/bin/env node

/*jshint node: true */
'use strict';

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _dgen = require('dgen');

var _dgen2 = _interopRequireDefault(_dgen);

var _datafile = require('datafile');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var serviceTemplates = {
    'OPERATION': ["service.yml", "postOperation-requestBody.json", "postOperation-responseBody.json"],
    'COLLECTION': ["service.yml", "getCollection-responseBody.json", "postCollection-requestBody.json", "postCollection-responseBody.json"],
    'RESOURCE': ["service.yml", "getResource-responseBody.json", "putResource-requestBody.json", "putResource-responseBody.json", "deleteResource-responseBody.json"]
};

var capitalizeFirstLetter = function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

var extendConfig = function extendConfig(serviceConfig) {
    var cName = capitalizeFirstLetter(serviceConfig.name);
    serviceConfig.cName = cName;

    return serviceConfig;
};

/**
 * Make a path string surely relative
 *
 * @arg {String} path - A string that represents an absolute or relative path
 *
 * @return {String} - The relative path
 *
 * @function
 */
var makeRelPath = function makeRelPath(path) {
    return path[0] === '/' ? path.substr(1, path.length) : path;
};

/**
 * Add a new service descriptor to the project
 *
 * @arg {Object} container - Container context object, holds config data of the application and supporting functions.
 * @arg {Object} args - Command arguments object. Contains the name-value pairs of command arguments.
 *
 * @function
 */
exports.add = function (container, args) {
    var context = container.config;
    var serviceConfig = args;
    if (serviceConfig.type && serviceConfig.path && serviceConfig.uriTemplate) {
        if (_lodash2.default.includes(['OPERATION', 'COLLECTION', 'RESOURCE'], serviceConfig.type)) {
            var servicePath = _path2.default.resolve(context.sourceDir, context.endpoints, makeRelPath(serviceConfig.path));
            container.logger.info('Create the "' + servicePath + '" ' + serviceConfig.type + '-type service with the following URL: ' + serviceConfig.uriTemplate);

            if (_dgen2.default.createDirectoryTree(servicePath, [], false)) {
                container.logger.info(servicePath + ' directory created');
                var templates = serviceTemplates[serviceConfig.type] || [];
                _lodash2.default.map(templates, function (template) {
                    _dgen2.default.processTemplate(extendConfig(serviceConfig), {
                        sourceBaseDir: _path2.default.resolve(context.servicesTemplates, serviceConfig.type),
                        targetBaseDir: servicePath,
                        template: template
                    });
                });
            } else {
                container.logger.info('ERROR: Could not create directory: ' + servicePath);
            }
        } else {
            container.logger.info('ERROR: Wrong type parameter: ' + serviceConfig.type);
        }
    } else {
        container.logger.info('ERROR: Missing or wrong parameter(s)');
    }
};

/**
 * Add one or more new service descriptors to the project in bulk mode
 *
 * @arg {Object} container - Container context object, holds config data of the application and supporting functions.
 * @arg {Object} args - Command arguments object. Contains the name-value pairs of command arguments.
 *
 * @function
 */
exports.addBulk = function (container, args) {
    var context = container.config;
    if (args.services) {
        var bulkServicesPath = _path2.default.resolve(args.services);
        var bulkServices = (0, _datafile.loadJsonFileSync)(bulkServicesPath);
        container.logger.info('Add new services to the project in bulk mode from "' + bulkServicesPath + '"');

        _lodash2.default.map(bulkServices, function (service) {
            return exports.add(container, service);
        });
    } else {
        container.logger.info('ERROR: missing arguments: services');
    }
};