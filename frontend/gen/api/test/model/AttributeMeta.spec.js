/**
 * Fast API
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: 0.1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 *
 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD.
    define(['expect.js', process.cwd()+'/src/index'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS-like environments that support module.exports, like Node.
    factory(require('expect.js'), require(process.cwd()+'/src/index'));
  } else {
    // Browser globals (root is window)
    factory(root.expect, root.FastApi);
  }
}(this, function(expect, FastApi) {
  'use strict';

  var instance;

  beforeEach(function() {
    instance = new FastApi.AttributeMeta();
  });

  var getProperty = function(object, getter, property) {
    // Use getter method if present; otherwise, get the property directly.
    if (typeof object[getter] === 'function')
      return object[getter]();
    else
      return object[property];
  }

  var setProperty = function(object, setter, property, value) {
    // Use setter method if present; otherwise, set the property directly.
    if (typeof object[setter] === 'function')
      object[setter](value);
    else
      object[property] = value;
  }

  describe('AttributeMeta', function() {
    it('should create an instance of AttributeMeta', function() {
      // uncomment below and update the code to test AttributeMeta
      //var instane = new FastApi.AttributeMeta();
      //expect(instance).to.be.a(FastApi.AttributeMeta);
    });

    it('should have the property attribute (base name: "attribute")', function() {
      // uncomment below and update the code to test the property attribute
      //var instane = new FastApi.AttributeMeta();
      //expect(instance).to.be();
    });

    it('should have the property label (base name: "label")', function() {
      // uncomment below and update the code to test the property label
      //var instane = new FastApi.AttributeMeta();
      //expect(instance).to.be();
    });

    it('should have the property visible (base name: "visible")', function() {
      // uncomment below and update the code to test the property visible
      //var instane = new FastApi.AttributeMeta();
      //expect(instance).to.be();
    });

    it('should have the property arbitraryInput (base name: "arbitrary_input")', function() {
      // uncomment below and update the code to test the property arbitraryInput
      //var instane = new FastApi.AttributeMeta();
      //expect(instance).to.be();
    });

  });

}));