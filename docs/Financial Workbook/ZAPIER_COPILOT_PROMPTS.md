# Zapier Copilot Prompts

Paste these into Zapier Copilot to draft a Zap. **Always review what Copilot builds**
(field mappings, Overwrite All Columns = False) and leave the Zap as a draft until checked.
Do not include phone, email or address fields.

## 1. DripJobs Invoice → Invoices tab

**First:** add a tab named `Invoices` to the workbook with these headers in row 1:

`Invoice ID | Invoice # | Deal ID | Deal # | Deal Name | Customer ID | Customer Name | Status | Total | Amount Paid | Balance | Date Created | Due Date | Last Updated`

**Prompt:**

> Build a Zap named "DripJobs Invoice → Invoices tab". Trigger: DripJobs, New Invoice Created. Step 2: Google Sheets, Lookup Spreadsheet Row on my Proper Painter workbook, worksheet "Invoices", lookup column "Invoice ID", lookup value = the trigger's Invoice Id, and tick "Create row if it doesn't exist yet". When creating, fill: Invoice ID = Invoice Id; Invoice # = Invoice Number; Deal ID = Deal Id; Deal # = Deal Number; Deal Name = Deal Name; Customer ID = Customer Id; Customer Name = Full Name; Status = Status; Total = Total Amount; Amount Paid = Amount Paid; Balance = Balance; Date Created = Date Created; Due Date = Due Date. Step 3: Google Sheets, Update Spreadsheet Row, same worksheet, Row = the row from step 2, updating only Status, Total, Amount Paid, Balance and Due Date, with Overwrite All Columns set to False. Use only Invoice Id for matching. Do not use phone, email or addresses anywhere. Do not publish; leave it as a draft so I can review it.

**Review checklist**
- Balance is the invoice **Balance**, not a customer credit field.
- Date Created comes with a time; add a Formatter step (Date/Time → Format, `MM/DD/YYYY`) if you want date-only.
- Step 3 has Overwrite All Columns = False.
- Only one Zap uses the "New Invoice Created" trigger.

## 2. DripJobs Payment → update Invoices tab

*Not written yet. Needs the New Payment Received sample fields first.*
