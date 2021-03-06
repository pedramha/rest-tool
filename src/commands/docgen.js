#!/usr/bin/env node
/*jslint node: true */
'use strict';

import _ from 'lodash'
import generator from 'dgen'
import path from 'path'
import { services } from 'rest-tool-common'

const createTargetDirectories = context => generator.createDirectoryTree(
    context.docsTargetDir, ["/images", "/js", "/sass", "/stylesheets", "services"], true)

/**
 * Copy files needed by the documentation
 */
const copyDocDependencies = context => _.map([
    "images", "js", "sass", "stylesheets"], dirName => {
    generator.copyDir({
        sourceBaseDir: context.docsTemplates,
        targetBaseDir: context.docsTargetDir,
        dirName: dirName,
        forceDelete: true,
        excludeHiddenUnix: true,
        preserveFiles: false,
        inflateSymlinks: true
    })
})

/**
 * Copy the whole services tree (temporary solution)
 */
const copyEndpoints = context => generator.copyDir({
    sourceBaseDir: context.sourceDir,
    targetBaseDir: context.docsTargetDir,
    dirName: context.endpoints,
    forceDelete: true,
    excludeHiddenUnix: true,
    preserveFiles: false,
    inflateSymlinks: true
})

const copyOtherFiles = context => _.map(["README.md"], fileName => {
    generator.copyFile(fileName, context.docsTemplates, context.docsTargetDir)
})

const initDocsFolder = context => {
    if (createTargetDirectories(context)) {
        copyDocDependencies(context)
        copyEndpoints(context)
        copyOtherFiles(context)
    }
    return true
}

const generateDocFileName = serviceDesc => serviceDesc.contentPath + '/service.html'

// Generate the main index page of the API documentation
const generateDocIndex = (container, context) => {
    container.logger.info('Generate document index');
    generator.processTemplate(context, {
        sourceBaseDir: context.docsTemplates,
        targetBaseDir: context.docsTargetDir,
        template: 'index.html'
    })
}

/**
 * Generate the HTML page for one service endpoint descriptor
 *
 * @arg {Object} serviceDesc - The service descriptor object
 * @arg {Object} context - Configuration parameters. See `config.load()`
  *
 * @function
 */
const generateServiceDoc = (container, serviceDesc, context) => {

    var relPath = "";
    for (let l=0; l<serviceDesc.contentPath.split('/').length; l++) {
        relPath = relPath + ".." + path.sep
    }

    container.logger.info('Generate service doc: ' + serviceDesc.contentPath, serviceDesc.name);
    container.logger.debug('context: ', context)

    const doc = _.merge({ relPath: relPath }, context,
        generator.convertMarkdown(serviceDesc, ['description', 'summary', 'details']))
    container.logger.debug(JSON.stringify(doc, null, '  '))

    generator.processTemplate( doc, {
        sourceBaseDir: context.docsTemplates,
        targetBaseDir: context.docsTargetDir,
        template: 'restapi.html',
        target: generateDocFileName(serviceDesc)
    })
}

/**
 * Generate the HTML format documentation
 *
 * @arg {Object} container - Container context object, holds config data of the application and supporting functions.
 * @arg {Object} args - Command arguments object. Contains the name-value pairs of command arguments.
 *
 * @function
 */
exports.update = (container, args) => {
    const context = container.config
    container.logger.info('Generate the HTML format documentation')
    initDocsFolder(context)

    // Load service descriptors
    services.load(context.sourceDir, context.endpoints)

    // Prepare the list of all services for generation of documents
    const allServices = services.getServices()

    context.serviceDocNames = _.map(allServices, function(serviceDesc) {
        return ({
            name: serviceDesc.name,
            docFileName: generateDocFileName(serviceDesc)
        })
    })

    // Set the time of generation
    context.lastUpdate = new Date()

    // Generate the documents for each service
    _.map(allServices, function (serviceDesc) {
        generateServiceDoc(container, serviceDesc, context)
    })

    // Generate the index.html
    generateDocIndex(container, context)
}
