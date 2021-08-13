/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
const tobin = 2716
const frombin = 2722
const consumptionbin = 2722

define(['N/query','./negativeutil'],
    /**
 * @param{query} query
 */
    (query, negativeutil) => {
        /**
         * Defines the function that is executed when a GET request is sent to a RESTlet.
         * @param {Object} requestParams - Parameters from HTTP request URL; parameters passed as an Object (for all supported
         *     content types)
         * @returns {string | Object} HTTP response body; returns a string when request Content-Type is 'text/plain'; returns an
         *     Object when request Content-Type is 'application/json' or 'application/xml'
         * @since 2015.2
         */
        const get = (requestParams) => {
            log.debug('requested with',requestParams)
            var expirationdate = new Date(requestParams.expirationdate*1000)
            const itemid = negativeutil.getitemidfromname(requestParams.item)
            log.debug('args',[itemid,requestParams.quantity,expirationdate,requestParams.lot,requestParams.pid, { frombin:frombin, tobin:tobin}])

            negativeutil.createtransferdelete(itemid,requestParams.quantity,expirationdate,requestParams.lot,requestParams.pid, {
                frombin:frombin,
                tobin:tobin
            })

            var wonum = requestParams.pid.substring(0,requestParams.pid.length)
            var woid = query.runSuiteQL(`SELECT Transaction.id from transaction where transaction.tranid = '${wonum}'`)

            negativeutil.checkoredittempadjustment('1402',12,new Date('04/04/2029'),'1',consumptionbin,woid)

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
