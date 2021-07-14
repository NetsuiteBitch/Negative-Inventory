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

                 // nutil.createtransferdelete(1402, "43", new Date('12/12/2029'), "testconsumption",'testpid',{tobin:2716,frombin:2722})
            nutil.voidtransferpid('yowhatup')



        }


        return {execute}

    });
