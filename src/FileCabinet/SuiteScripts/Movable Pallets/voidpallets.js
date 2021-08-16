/**
 * @NApiVersion 2.1
 * @NScriptType Restlet
 */
define(['N/query','./negativeutil','N/error'],
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
            var wonum = requestParams.pid.substring(0,requestParams.pid.length-3)
            var iaid = query.runSuiteQL(`Select transaction.id as iaid from transaction where BUILTIN.DF(transaction.custbody_tempwo) like '%${wonum}'`).asMappedResults()[0].iaid
            negativeutil.changefirstlineofadjustment(iaid,requestParams.lot, requestParams.quantity)
            // log.debug('lot',requestParams.lot)
            // log.debug('quantity',requestParams.quantity)
            // log.debug('item',requestParams.item)
            // const itemid = negativeutil.getitemidfromname(requestParams.item)
            // // log.debug('newitem',itemid)
            // const tobin = 2716
            // const frombin = 2722
            // log.debug('params',[itemid,requestParams.quantity,new Date('12/12/2029'),requestParams.lot])

            // negativeutil.voidtransfer(itemid,requestParams.quantity,requestParams.expirationdate,requestParams.lot,{
            //     frombin:frombin,
            //     tobin:tobin
            // })


            log.debug('requested delete of', requestParams.pid)
            var thequery = `
            SELECT Transaction.id from Transaction where Transaction.custbody_cc_palletid = '${requestParams.pid}'
            `
            var results = query.runSuiteQL(thequery).asMappedResults()

            if(!results.length){
                log.debug('missing')
                var missingerror = {
                    title: "PALLET_MISSING",
                    message: "This pallet is not in the system"
                }
                return JSON.stringify(missingerror)
            }

            results.map((x) => record.delete({
                type: record.Type.BIN_TRANSFER,
                id: x.id
            }))
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
