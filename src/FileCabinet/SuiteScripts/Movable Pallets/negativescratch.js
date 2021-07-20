/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record','./negativeutil'],
    /**
 * @param{record} record
 */
    (record,nutil) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {

            var requestParams = {
                quantity:100,
                wo: 'WO370'
            }

            const formulaid = negativeutil.getformulafromwo(requestParams.wo)
            const formulafactor = negativeutil.getformulafactor(requestParams.wo)
            const formulafrombin = 2723
            const formulatobin = 2717

            negativeutil.createtransferdelete(formulaid,requestParams.quantity*formulafactor,"", requestParams.wo+"MIX","",{
                frombin:formulafrombin,tobin:formulatobin
            })

        }


        return {execute}

    });
