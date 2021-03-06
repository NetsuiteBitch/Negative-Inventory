/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record','./negativeutil'],
    /**
 * @param{record} record
 */
    (record, negativeutil) => {

        /**
         * Defines the Scheduled script trigger point.
         * @param {Object} scriptContext
         * @param {string} scriptContext.type - Script execution context. Use values from the scriptContext.InvocationType enum.
         * @since 2015.2
         */
        const execute = (scriptContext) => {

         const  args = [
                1368,
                    "97",
                    "2023-02-01T00:00:00.000Z",
                    "21321",
                    "WO433045",
                    {
                        frombin: 2722,
                        tobin: 2716
                    }
                ]

            negativeutil.changefirstlineofadjustment(146400,"221",13)
        }

        function changeadjustment(){

        }

        return {execute}

    });
