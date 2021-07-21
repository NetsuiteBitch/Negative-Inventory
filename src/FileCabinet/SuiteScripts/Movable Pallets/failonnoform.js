/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/error','N/query'],
    /**
 * @param{error} error
 */
    (error,query) => {
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
            var rec = scriptContext.newRecord
            const itemlen = rec.getLineCount('component')

            for(var i=0;i<itemlen;i++){
                const item = rec.getSublistValue({
                    sublistId:'component',
                    fieldId: 'item',
                    line:i
                })

                const type = query.runSuiteQL(`
                select item.itemtype from item where item.id = ${item}
                `).asMappedResults()[0]['itemtype']

                if(type == 'Assembly'){
                    var quantity = rec.getSublistValue({
                        sublistId: 'component',
                        fieldId: 'quantity',
                        line:i
                    })

                    if(!quantity){
                        log.debug('missing',`${item} has 0`)
                        throw error.create({
                            message:'Missing Sub-Assemblies',
                            name:'MISSING_SUB_ASSEMBLIES'
                        })

                    }
                }
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

        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
