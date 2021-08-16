/**
 * @NApiVersion 2.1
 */


const tconsumptionbin = 2716
const mainlocation = 5
const adjaccount = 1238
const subsidiary = 2
const defaultstatus = 1

define(['N/record', 'N/query','N/ui/message'],
    /**
     * @param{record} record
     */
    (record, query,message) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */


        function createtransferdelete(itemid, quantity, expirationdate, lotnumber, pid, defaults) {
            expirationdate.setDate(expirationdate.getDate() + 1)
            var initialadjusment = createinventoryadjustment(itemid, quantity, expirationdate, lotnumber, defaults.frombin)
            createbintransfer(itemid, quantity, defaults.frombin, defaults.tobin, lotnumber, pid)
            record.delete({
                type: record.Type.INVENTORY_ADJUSTMENT,
                id: initialadjusment
            })

        }


        function voidtransfer(itemid, quantity, expirationdate, lotnumber, defaults) {

            createbintransfer(itemid, quantity, defaults.tobin, defaults.frombin, lotnumber)

        }

        function voidtransferpid(pid) {

            var thequery = `
            SELECT Transaction.id from Transaction where Transaction.custbody_cc_palletid = '${pid}'
            `

            record.delete({
                type: record.Type.BIN_TRANSFER,
                id: query.runSuiteQL(thequery).results[0].values[0]
            })
        }

        function checkoredittempadjustment(itemid, quantity,expirationdate, lottext, binid, woid) {
            var theQuery = `
            SELECT
              transaction.id as iaid
            FROM
              transaction
            WHERE
              transaction.custbody_tempwo = ${woid}
            `
            var iaid = query.runSuiteQL(theQuery).asMappedResults()[0]?.iaid
            log.debug(iaid)
            if (iaid) {
                log.debug('ia found', 'changing')
                changefirstlineofadjustment(iaid, lottext, quantity)
                return iaid
            } else {
                return createinventoryadjustment(itemid, quantity, expirationdate,lottext, binid, woid)
            }
        }


        function createinventoryadjustment(itemid, quantity, expirationdate, lottext, binid, woid) {
            // log.debug('in inventory function',woid)
            log.debug('cia', [itemid, quantity, expirationdate, lottext, binid, woid])
            var obj = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true,
                defaultValues: {'customform': 230}
            });

            obj.setValue({fieldId: 'subsidiary', value: subsidiary});
            obj.setValue({fieldId: 'adjlocation', value: mainlocation});
            obj.setValue({fieldId: 'account', value: adjaccount});
            obj.setValue({fieldId: 'custbody_tempwo', value: parseInt(woid, 10)})

            obj.selectNewLine({sublistId: 'inventory'});

            obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'item', value: itemid});
            obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'adjustqtyby', value: quantity});
            obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'location', value: mainlocation});

            var x = obj.getCurrentSublistSubrecord({sublistId: 'inventory', fieldId: 'inventorydetail'});

            x.selectNewLine({sublistId: 'inventoryassignment'});

            x.setCurrentSublistText({
                sublistId: 'inventoryassignment',
                fieldId: 'receiptinventorynumber',
                text: lottext
            });
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binid});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1});
            x.setCurrentSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'expirationdate',
                value: expirationdate
            });
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', value: quantity});

            x.commitLine({sublistId: 'inventoryassignment'});

            obj.commitLine({sublistId: 'inventory'});

            return obj.save();
        }

        function changefirstlineofadjustment(iaid, lot, qty) {
            log.debug('changinlineargs',[iaid,lot,qty])
            var rec = record.load({
                type: record.Type.INVENTORY_ADJUSTMENT,
                id: iaid
            })

            var currentqty = rec.getSublistValue({fieldId: 'adjustqtyby', sublistId: 'inventory', line: 0})

            if (currentqty + qty == 0) {
                record.delete({
                    type: record.Type.INVENTORY_ADJUSTMENT,
                    id: iaid
                })
                return
            }

            rec.setSublistValue({fieldId: 'adjustqtyby', sublistId: 'inventory', line: 0, value: currentqty + qty})

            var ideets = rec.getSublistSubrecord({sublistId: 'inventory', fieldId: 'inventorydetail', line: 0})

            for (var j = 0; j < ideets.getLineCount('inventoryassignment'); j++) {
                var oldlotnumber = ideets.getSublistValue({
                    sublistId: 'inventoryassignment',
                    fieldId: 'receiptinventorynumber',
                    line: j
                })

                if (oldlotnumber == lot) {
                    var linequantity = ideets.getSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        line: j

                    })
                    log.debug(typeof linequantity, typeof qty)

                    var newquantity = linequantity + qty

                    if(newquantity < 0){
                        var msg = message.create({
                            type: message.Type.WARNING,
                            title: 'Pallet Tags Not Printed!'
                        })
                        msg.show()

                        return -1
                    }
                    if (newquantity == 0) {
                        ideets.removeLine({
                            sublistId: 'inventoryassignment',
                            line: j
                        })
                        log.debug('deleting line', lot)
                        rec.save()
                        return;
                    }

                    ideets.setSublistValue({
                        sublistId: 'inventoryassignment',
                        fieldId: 'quantity',
                        line: j,
                        value: newquantity
                    })

                    rec.save()
                    return
                }
            }
            ideets.insertLine({sublistId: 'inventoryassignment', line: 0});
            ideets.setSublistText({
                sublistId: 'inventoryassignment',
                fieldId: 'receiptinventorynumber',
                text: lot,
                line: 0
            });
            ideets.setSublistValue({sublistId: 'inventoryassignment', fieldId: 'binnumber', value: tconsumptionbin, line: 0});
            ideets.setSublistValue({sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: defaultstatus, line: 0});
            ideets.setSublistValue({
                sublistId: 'inventoryassignment',
                fieldId: 'expirationdate',
                value: new Date(),
                line: 0
            });
            ideets.setSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', value: qty, line: 0});
            rec.save()
        }


        function createbintransfer(itemid, quantity, binid, tobinid, lottext, pid) {

            var obj = record.create({
                type: record.Type.BIN_TRANSFER,
                isDynamic: true
            });

            obj.setValue({fieldId: 'location', value: 5});
            obj.setValue({fieldId: 'custbody_cc_palletid', value: pid});

            obj.selectNewLine({sublistId: 'inventory'});
            obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'item', value: itemid});
            obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'quantity', value: quantity});

            var x = obj.getCurrentSublistSubrecord({sublistId: 'inventory', fieldId: 'inventorydetail'});

            x.selectNewLine({sublistId: 'inventoryassignment'});
            x.setCurrentSublistText({sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber', text: lottext});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binid});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'tobinnumber', value: tobinid});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', value: quantity});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'status', value: 1});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'tostatus', value: 1});


            x.commitLine({sublistId: 'inventoryassignment'});

            obj.commitLine({sublistId: 'inventory'});

            var recID = obj.save();
        }

        function getitemidfromname(itemname) {

            var thequery = `Select item.id from item where item.itemid = '${itemname}'`

            return query.runSuiteQL(thequery).results[0].values[0]
        }


        function getformulafromwo(woname) {
            var woquery = `
            SELECT Transactionline.item
            from
            Transaction INNER JOIN
            Transactionline
            ON
            Transaction.id = Transactionline.transaction

            INNER JOIN ITEM ON transactionline.item = item.id


            Where transaction.tranid = ${woname}
            and transactionline.mainline = 'F'
            And Item.itemtype = 'Assembly'
            `
            var result = query.runSuiteQL(woquery).results[0].values[0]
            return result
        }

        function getformulafactor(woname) {
            var woquery = `
            SELECT  -1*(Transactionline.quantity/tr.quantity), 
            from 
            Transaction INNER JOIN 
            Transactionline 
            ON 
            Transaction.id = Transactionline.transaction 

            INNER JOIN ITEM ON transactionline.item = item.id

            inner join (
             SELECT Transactionline.quantity
            from 
            Transaction INNER JOIN 
            Transactionline 
            ON 
            Transaction.id = Transactionline.transaction 

            INNER JOIN ITEM ON transactionline.item = item.id
            where transactionline.mainline = 'T' and transaction.tranid = 'WO370') as tr on 1=1


            Where transaction.tranid = ${woname}
            and transactionline.mainline = 'F'
            And Item.itemtype = 'Assembly'
            `
            var result = query.runSuiteQL(woquery).results[0].values[0]
            return result
        }


        return {
            voidtransferpid: voidtransferpid,
            voidtransfer: voidtransfer,
            createtransferdelete: createtransferdelete,
            getitemidfromname: getitemidfromname,
            getformulafromwo: getformulafromwo,
            getformulafactor: getformulafactor,
            createinventoryadjustment: createinventoryadjustment,
            changefirstlineofadjustment: changefirstlineofadjustment,
            checkoredittempadjustment:checkoredittempadjustment
        }

    });
