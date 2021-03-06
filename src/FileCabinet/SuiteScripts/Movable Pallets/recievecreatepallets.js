/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
const tobin = 2716
const frombin = 2716
const consumptionbin = 2716

define(['N/query','N/record','N/error','./negativeutil'],
    /**
 * @param{query} query
 */
    (query, record,error,negativeutil) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {


            if(!requestParams.pid){
                return "Missing PID"
            }
            if(!requestParams.expirationdate){
                return "Missing Expiration Date"
            }
            if(!requestParams.lot){
                return "Missing Lot"
            }
            if(!requestParams.item){
                return "Missing Item"
            }
            if(!requestParams.quantity){
                return "Missing quantity"
            }

            const expirationdate = new Date(requestParams.expirationdate*1000)
            const itemid = negativeutil.getitemidfromname(requestParams.item)
            if(!itemid){
                return "Invalid Item"
            }

            const wonum = requestParams.pid.substring(0,requestParams.pid.length-3)
            const woidquery = query.runSuiteQL(`SELECT Transaction.id as woid from transaction where transaction.tranid LIKE '%${wonum}'`).asMappedResults()
            if(!woidquery[0]){
                return "Work Order Not Found!"
            }
            const woid = woidquery[0].woid
            log.debug('woid',woid)

            const quantity = parseInt(requestParams.quantity, 10)
            log.debug('requested with',requestParams)
            log.debug('args',[itemid,requestParams.quantity,expirationdate,requestParams.lot,requestParams.pid, { frombin:frombin, tobin:tobin}])
            log.debug('wonum',wonum)
            log.debug('woid',woid)
            var iaid = negativeutil.checkoredittempadjustment(itemid,quantity,expirationdate,requestParams.lot,consumptionbin,woid)
            return "success" + "\niaid:" + iaid
        }

        /**
         * Defines the function that is executed when a PUT request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body are passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const put = (requestBody) => {

        }

        /**
         * Defines the function that is executed when a POST request is sent to a RESTlet.
         * @param {string | Object} requestBody - The HTTP request body; request body is passed as a string when request
         *     Content-Type is 'text/plain' or parsed into an Object when request Content-Type is 'application/json' (in which case
         *     the body must be a valid JSON)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const post = (requestBody) => {

        }

        /**
         * Defines the function that is executed when a DELETE request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters are passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const doDelete = (requestParams) => {

        }

        return {get, put, post, delete: doDelete}

    });
