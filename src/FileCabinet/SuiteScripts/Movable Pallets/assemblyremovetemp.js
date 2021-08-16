/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/query', './negativeutil'],

    (query, negativeutil) => {
        /**
         * Defines the function definition that is executed before record is loaded.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @param {Form} scriptContext.form - Current form
         * @param {ServletRequest} scriptContext.request - HTTP request information sent from the browser for a client action only.
         * @since 2015.2
         */
        const beforeLoad = (scriptContext) => {

        }

        /**
         * Defines the function definition that is executed before record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const beforeSubmit = (scriptContext) => {
            var rec;
            log.debug(scriptContext.type)
            if (scriptContext.type !== scriptContext.UserEventType.DELETE) {
                return
            }
            rec = scriptContext.oldRecord
            var woid = rec.getValue('createdfrom')
            var produceddetail = rec.getSubrecord('inventorydetail')
            var produceddetaillength = produceddetail.getLineCount('inventoryassignment')
            for (var i = 0; i < produceddetaillength; i++) {

                var lottext = produceddetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber',
                    line: i
                })

                var quantity = produceddetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    line: i
                })

                log.debug('additions', [woid, lottext, quantity])
                var theQuery = `
                    SELECT
                      transaction.id as iaid
                    FROM
                      transaction
                    WHERE
                      transaction.custbody_tempwo = ${woid}
                 `
                var iaid = query.runSuiteQL(theQuery).asMappedResults()[0]?.iaid

                negativeutil.changefirstlineofadjustment(iaid, lottext, quantity)
            }


        }

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */
        const afterSubmit = (scriptContext) => {

            var rec;
            log.debug(scriptContext.type)
            if (scriptContext.type !== scriptContext.UserEventType.CREATE) {
                return;
            }

            rec = scriptContext.newRecord

            var woid = rec.getValue('createdfrom')
            var produceddetail = rec.getSubrecord('inventorydetail')
            var produceddetaillength = produceddetail.getLineCount('inventoryassignment')
            for (var i = 0; i < produceddetaillength; i++) {

                var lottext = produceddetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber',
                    line: i
                })

                var quantity = produceddetail.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'quantity',
                    line: i
                })

                log.debug('additions', [woid, lottext, quantity])
                var theQuery = `
                    SELECT
                      transaction.id as iaid
                    FROM
                      transaction
                    WHERE
                      transaction.custbody_tempwo = ${woid}
                 `
                var iaid = query.runSuiteQL(theQuery).asMappedResults()[0]?.iaid
                var multiplyer = scriptContext.type = scriptContext.UserEventType.CREATE ? -1 : 1
                negativeutil.changefirstlineofadjustment(iaid, lottext, multiplyer * quantity)
            }

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
