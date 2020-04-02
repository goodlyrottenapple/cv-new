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

import ApiClient from '../ApiClient';
import AnyOfBaseQueryGroupQuery from './AnyOfBaseQueryGroupQuery';

/**
 * The Query model module.
 * @module model/Query
 * @version 0.1.0
 */
class Query {
    /**
     * Constructs a new <code>Query</code>.
     * @alias module:model/Query
     * @param query {module:model/AnyOfBaseQueryGroupQuery} 
     */
    constructor(query) { 
        
        Query.initialize(this, query);
    }

    /**
     * Initializes the fields of this object.
     * This method is used by the constructors of any subclasses, in order to implement multiple inheritance (mix-ins).
     * Only for internal use.
     */
    static initialize(obj, query) { 
        obj['query'] = query;
    }

    /**
     * Constructs a <code>Query</code> from a plain JavaScript object, optionally creating a new instance.
     * Copies all relevant properties from <code>data</code> to <code>obj</code> if supplied or a new instance if not.
     * @param {Object} data The plain JavaScript object bearing properties of interest.
     * @param {module:model/Query} obj Optional instance to populate.
     * @return {module:model/Query} The populated <code>Query</code> instance.
     */
    static constructFromObject(data, obj) {
        if (data) {
            obj = obj || new Query();

            if (data.hasOwnProperty('query')) {
                obj['query'] = ApiClient.convertToType(data['query'], AnyOfBaseQueryGroupQuery);
            }
        }
        return obj;
    }


}

/**
 * @member {module:model/AnyOfBaseQueryGroupQuery} query
 */
Query.prototype['query'] = undefined;






export default Query;
