/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record','N/query'],
    
    (record,query) => {
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
            log.debug(rec.getValue('location'))
            if(rec.getValue('location') !== '5'){
                return
            }
            var invlen = rec.getLineCount('inventory')
            var itarr = []
            for(var i = 0;i<invlen;i++){
                var itemid = rec.getSublistValue({
                    sublistId:'inventory',
                    fieldId: 'item',
                    line: i
                })

                var quantity = rec.getSublistValue({
                    sublistId:'inventory',
                    fieldId: 'adjustqtyby',
                    line: i
                })


                var invsub = rec.getSublistSubrecord({
                    sublistId: 'inventory',
                    fieldId: 'inventorydetail',
                    line:i
                })

                var subs = []

                var invsubcount = invsub.getLineCount('inventoryassignment')

                for(var j=0;j<invsubcount;j++){
                    var lotnum = invsub.getSublistValue({
                        sublistId:'inventoryassignment',
                        fieldId: 'issueinventorynumber',
                        line: i
                    })

                    lotnum = convertlotnumtotext(lotnum)

                    var frombin = invsub.getSublistValue({
                        sublistId:'inventoryassignment',
                        fieldId: 'binnumber',
                        line:i
                    })

                    var subqty = invsub.getSublistValue({
                        sublistId:'inventoryassignment',
                        fieldId: 'quantity',
                        line:i
                    })

                    var expiration = invsub.getSublistValue({
                        sublistId:'inventoryassignment',
                        fieldId: 'expirationdate',
                        line:i
                    })

                    subs.push({lot:lotnum,bin:frombin,subquantity:subqty,expiration:expiration})
                }
                itarr.push({item:itemid,totalquantity:quantity,subs:subs})
                log.debug('myarr',itarr)
            }
            log.debug('myarr',itarr)
            createinventory(itarr)
        }

        var testcreateinventory = [ {
                item: "1402",
                totalquantity: 330,
                subs: [
                    {
                        lot: "27353",
                        bin: "2716",
                        subquantity: 330,
                        expiration: "2023-01-16T08:00:00.000Z"
                    } ] } ]


        function createinventory(itarr){
            log.debug('creatinginventory...',itarr)
            var newrec = record.create({
                type:record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            })

            // newrec.setValue('adjlocation','5')
            newrec.setValue('subsidiary','2')
            newrec.setValue('memo','temp adjust')
            newrec.setValue({fieldId: 'account', value: 1238});

            for(const i of itarr){
                newrec.selectNewLine('inventory')
                newrec.setCurrentSublistValue('inventory','item',i.item)
                newrec.setCurrentSublistValue('inventory','adjustqtyby',i.totalquantity)
                newrec.setCurrentSublistValue('inventory','location',5)
                var linesubrec = newrec.getCurrentSublistSubrecord({sublistId: 'inventory', fieldId: 'inventorydetail'});
                for(const j of i.subs){
                    linesubrec.selectNewLine({sublistId: 'inventoryassignment'});
                    linesubrec.setCurrentSublistText({sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', text: j.lot});
                    linesubrec.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'binnumber', value: j.bin});
                    linesubrec.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1});
                    linesubrec.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'expirationdate', value: j.expiration});
                    linesubrec.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', value: j.subquantity});
                    linesubrec.commitLine({sublistId:'inventoryassignment'})
                }
                newrec.commitLine({sublistId: 'inventory'})
            }
            newrec.save({ignoreMandatoryFields:true})
        }

        function convertlotnumtotext(text){
            var thequery = `select  inventorynumber.inventorynumber  from inventorynumber  where inventorynumber.id = '${text}'`
            return query.runSuiteQL(thequery).results[0].values[0]
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
            cleanup()
        }


        function cleanup(){
            var thequery = `
            select transaction.id from transaction where transaction.memo = 'temp adjust'
            `
            query.runSuiteQL(thequery).asMappedResults().map((x) => {
                record.delete({
                    type:record.Type.INVENTORY_ADJUSTMENT,
                    id:x.id
                })
            })
        }

        return {beforeLoad, beforeSubmit, afterSubmit}

    });
