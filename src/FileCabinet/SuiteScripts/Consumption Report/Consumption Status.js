/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/query', 'N/ui/serverWidget'],
    /**
 * @param{query} query
 * @param{serverWidget} serverWidget
 */
    (query, serverWidget) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            var form = serverWidget.createForm({
                title: 'Consumption Status'
            })

            var htmlfield = form.addField({
                id: 'mainhtmlreport',
                type: serverWidget.FieldType.INLINEHTML,
                label: "Report"
            })

            var jsfield = form.addField({
                id: 'mainjsreport',
                type: serverWidget.FieldType.INLINEHTML,
                label: "JS"
            })

            jsfield.isDisplay = false
            jsfield.defaultValue = `console.log('yolo')\n`

            var cssstring = `<style>
                                #containerdiv {
                                    display: flex;
                                    width: 100%;
                                    border: 1px;
                                    height:  calc(100vh - 100px);
                                }
                                
                                .liheader {
                                    margin: auto;
                                }
                                
                                #barslist {
                                    list-style: none;
                                }
                                .barlistitem {
                                    display: flex !important;
                                    flex-direction: row;
                                    padding: 10px;
                                }
                                
                                
                                
                                #leftdiv {
                                    flex: 50%;
                                    border-right: 2px solid black;
                                    height: 100%;
                                }
                                
                                #rightdiv {
                                    flex: 50%;
                                    height: 100%;
                                }
                                .stacked-bar-graph {
                              width: 60%;
                              height: 38px;
                              color: #414042;
                              margin-left: auto;
                              margin-right: auto;
                              display: flex;
                              flex-direction: row;
                              overflow: hidden;
                              border: 1px solid darkgreen;
                              border-radius: 10px;
                            }
                            .wbar {
                              display: inline-block;
                              height: 100%;
                              box-sizing: border-box;
                              float: left;
                              position: relative;
                              font-weight: bold;
                              font-family: arial, sans-serif;
                              outline: 1px solid black;
                            }
                            .bar-1 {
                              background: #259202;
                            }
                            .bar-2 {
                              background: #d9f8cb;
                            }
                            .bar-3 {
                              background: #ffffff;
                            }

                            </style>`

            var htmlstring  = `${cssstring}<div id="containerdiv"><div id="leftdiv"></div><div id="rightdiv"></div></div>`
            htmlfield.defaultValue = htmlstring



            var theQuery = `
            SELECT
              docnum,
              DATE,
              assembly,
              status,
              planned,
              lot,
              SUM(not_consumed) + SUM(consumed) AS total,
              SUM(not_consumed) AS not_consumed,
              SUM(consumed) AS consumed
            FROM
              (
                SELECT
                  transaction.tranid AS DOCNUM,
                  transaction.startdate AS DATE,
                  BUILTIN.DF(transactionline.item) AS Assembly,
                  BUILTIN.DF(transaction.status) AS Status,
                  transactionline.quantity AS planned,
                  BUILTIN.DF(ialineassignment.inventorynumber) AS LOT,
                  ialineassignment.quantity AS Not_consumed,
                  0 AS consumed,
                FROM
                  transaction
                  INNER JOIN transactionline ON transactionline.transaction = transaction.id
                  AND transactionline.mainline = 'T'
                  INNER JOIN Transaction AS ia ON ia.custbody_tempwo = transaction.id
                  INNER JOIN transactionline AS ialine ON ialine.transaction = ia.id
                  INNER JOIN inventoryassignment AS ialineassignment ON ialineassignment.transactionline = ialine.id
                  AND ialineassignment.transaction = ialine.transaction
                WHERE
                  transaction.type = 'WorkOrd'
                  AND transaction.status NOT IN ('A', 'G', 'H')
                  AND transaction.startdate > To_date('08/10/2021', 'MM/DD/YYYY')
                UNION ALL
                SELECT
                  transaction.tranid AS docnum,
                  transaction.startdate AS DATE,
                  BUILTIN.DF(transactionline.item) AS Assembly,
                  BUILTIN.DF(transaction.status) AS Status,
                  transactionline.quantity AS planned,
                  BUILTIN.DF(astlineassignment.inventorynumber) AS LOT,
                  0 AS not_consumed,
                  astlineassignment.quantity AS consumed
                FROM
                  transaction
                  INNER JOIN transactionline ON transactionline.transaction = transaction.id
                  AND transactionline.mainline = 'T'
                  INNER JOIN transactionline AS astline ON astline.createdfrom = transaction.id
                  INNER JOIN inventoryassignment AS astlineassignment ON astlineassignment.transactionline = astline.id
                  AND astlineassignment.transaction = astline.transaction
                WHERE
                  transaction.type = 'WorkOrd'
                  AND transaction.status NOT IN ('A', 'G', 'H')
                  AND transaction.startdate > To_date('08/10/2021', 'MM/DD/YYYY')
              )
            GROUP BY
              docnum,
              DATE,
              assembly,
              status,
              planned,
              lot
            ORDER BY
              docnum,
              lot
            `
            var info = query.runSuiteQL(theQuery).asMappedResults()
            log.debug('woinfo',info)
            var uniq = [... new Set(info.map(x => x.docnum))]
            var split = uniq.map((x) => info.filter(y => y.docnum  == x))
            var joined = split.map(x => [x[0].docnum,x[0].planned,x[0].status,x[0].date,x.reduce((y,z) => z.not_consumed+y,0),x.reduce((y,z) => z.consumed+y,0),x[0].assembly])
            var mappedfields = {0:"docnum", 1:"planned", 2: "status", 3:"date", 4:"not_consumed", 5:"consumed",6:"assembly"}
            var joined = joined.map((x) => {var target = new Object(); x.forEach((y,i) => target[mappedfields[i]] =y); return target})
            //var joined = joined.map(x => {var target ={}; x.forEach((y,i) => target[mappedfields[i]] = y); return target})
            //log.debug(joined)

            function bar(bararray){
                var woid = bararray.docnum
                var assembly = bararray.assembly
                var planned =  bararray.planned
                var not_consumed = bararray.not_consumed
                var consumed = bararray.consumed
                var consumedpercent = Math.round(((consumed)/planned) * 100)
                var consumeddisplay = consumedpercent == 0 ? 'display:none;' : ""
                var madepercent = Math.round(((not_consumed)/planned) * 100)
                var madedisplay = madepercent == 0 ? 'display:none;' : ""
                var restpercent = 100 - madepercent - consumedpercent
                var restdisplay = restpercent == 0 ? 'display:none;' : ""

                return `<li class="barlistitem">
                    <button>Details</button>
                    <p class="liheader">${woid} - ${assembly}</p>
                    <div class="stacked-bar-graph">
                    <span style="width:${consumedpercent}%;" class="bar-1 wbar"></span>
                    <span style="width:${madepercent}%;" class="bar-2 wbar"></span>
                    <span style="width:${restpercent}%;" class="bar-3 wbar"></span>
                </div>
                    </li>
                    `
            }

            var bars = joined.map(x => bar(x))
            log.debug('bars',bars)
            jsfield.defaultValue += `
                var bars = ${JSON.stringify(bars)}
                
                console.log(bars)
                var barshtml = bars.reduce((x,y) => x+y,'<ul id="barslist">')+'</ul>'
                document.getElementById('leftdiv').insertAdjacentHTML('beforeend', barshtml)
            `

            jsfield.defaultValue = `<script>${jsfield.defaultValue}</script>`

            scriptContext.response.write(htmlfield.defaultValue+jsfield.defaultValue)

        }

        return {onRequest}

    });
