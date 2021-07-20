/**
 * @NApiVersion 2.1
 */
define(['N/record','N/query'],
    /**
 * @param{record} record
 */
    (record,query) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */


        function createtransferdelete(itemid,quantity,expirationdate,lotnumber,pid,defaults){
            expirationdate.setDate(expirationdate.getDate()+1)
            var initialadjusment = createinventoryadjustment(itemid,quantity,expirationdate,lotnumber,defaults.frombin)
            createbintransfer(itemid,quantity,defaults.frombin,defaults.tobin,lotnumber,pid)
            record.delete({
                type: record.Type.INVENTORY_ADJUSTMENT,
                id: initialadjusment
            })

        }


        function voidtransfer(itemid,quantity,expirationdate,lotnumber,defaults){

            createbintransfer(itemid,quantity,defaults.tobin,defaults.frombin,lotnumber)

        }

        function voidtransferpid(pid){

            var thequery = `
            SELECT Transaction.id from Transaction where Transaction.custbody_cc_palletid = '${pid}'
            `

            record.delete({
                type: record.Type.BIN_TRANSFER,
                id: query.runSuiteQL(thequery).results[0].values[0]
            })
        }


        function createinventoryadjustment(itemid,quantity,expirationdate,lottext,binid){
            var obj = record.create({
                type: record.Type.INVENTORY_ADJUSTMENT,
                isDynamic: true
            });
            obj.setValue({fieldId: 'subsidiary', value: 2});
            obj.setValue({fieldId: 'adjlocation', value: 5});
            obj.setValue({fieldId: 'account', value: 1238});

            obj.selectNewLine({sublistId: 'inventory'});
            obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'item', value: itemid});

            obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'adjustqtyby', value: 100000});
            obj.setCurrentSublistValue({sublistId: 'inventory', fieldId: 'location', value: 5});

            var x = obj.getCurrentSublistSubrecord({sublistId: 'inventory', fieldId: 'inventorydetail'});

            x.selectNewLine({sublistId: 'inventoryassignment'});

            x.setCurrentSublistText({sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', text: lottext});
            // x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'receiptinventorynumber', value: '8753'});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'binnumber', value: binid});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'inventorystatus', value: 1});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'expirationdate', value: expirationdate});
            x.setCurrentSublistValue({sublistId: 'inventoryassignment', fieldId: 'quantity', value: 100000});

            x.commitLine({sublistId: 'inventoryassignment'});

            obj.commitLine({sublistId: 'inventory'});

            return obj.save();

        }




        function createbintransfer(itemid,quantity,binid,tobinid,lottext,pid){

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

        function getitemidfromname(itemname){

            var thequery = `Select item.id from item where item.itemid = '${itemname}'`

            return query.runSuiteQL(thequery).results[0].values[0]
        }


        function getformulafromwo(woname){
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

        function getformulafactor(woname){
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


        return {voidtransferpid:voidtransferpid,voidtransfer:voidtransfer,createtransferdelete:createtransferdelete,getitemidfromname:getitemidfromname,getformulafromwo:getformulafromwo, getformulafactor:getformulafactor}

    });
