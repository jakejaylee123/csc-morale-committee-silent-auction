const MILLISECONDS_IN_SECOND = 1000;

const SOURCE_START_ROW_INDEX = 3;

const SOURCE_ITEM_NUM_INDEX = 0;
const SOURCE_CAT_NAME_INDEX = 1;
const SOURCE_DESC_INDEX = 2;
const SOURCE_MIN_PRICE_INDEX = 3;

const DEST_CAT_CODE_INDEX = 0;
const DEST_ITEM_NUMBER_INDEX = 1;
const DEST_DESC_INDEX = 2;
const DEST_MIN_PRICE_INDEX = 3;

const ITEM_NUM_ALPHABETICAL_PART_REGEX = /[a-zA-Z]*/;

const CONSOLIDATED_WORKSHEET_NAME = "CONSOLIDATED";

function stringReplaceAll(value: string, searchValue: string, replaceValue: string): string {
  let currentValue = value.replace(searchValue, replaceValue);
  while (currentValue !== value) {
    value = currentValue;
    currentValue = currentValue.replace(searchValue, replaceValue);
  }
  return currentValue;
}

function getSheetUsedRangeValues(sheet: ExcelScript.Worksheet): (string | number | boolean)[][] {
  return sheet.getUsedRange().getValues();
}

function logWorksheetName(sheet: ExcelScript.Worksheet): void {
  console.log(`Now processing items from worksheet '${sheet.getName()}'`);
}

function main(workbook: ExcelScript.Workbook) {
  const startTimeMs = performance.now();

  const consolidatedWorksheet = workbook
    .getWorksheets()
    .find(sheet => sheet.getName() === CONSOLIDATED_WORKSHEET_NAME);
  consolidatedWorksheet.getUsedRange().clear();

  var destinationRowIndex = 0;

  for (const sheet of workbook.getWorksheets()) {
    if (sheet.getName() === CONSOLIDATED_WORKSHEET_NAME) {
      continue;
    }

    logWorksheetName(sheet);
    const usedRangeValues = getSheetUsedRangeValues(sheet);

    for (let i = SOURCE_START_ROW_INDEX; true; ++i) {
      const description = usedRangeValues[i][SOURCE_DESC_INDEX].toString();
      if (!description) break;
      const descriptionOfficial = stringReplaceAll(description, ",", ";");

      const tagNumber = usedRangeValues[i][SOURCE_ITEM_NUM_INDEX].toString();

      const categoryCode = ITEM_NUM_ALPHABETICAL_PART_REGEX.exec(tagNumber)?.pop();
      const itemNumber = tagNumber.replace(ITEM_NUM_ALPHABETICAL_PART_REGEX, "");

      const minPrice = usedRangeValues[i][SOURCE_MIN_PRICE_INDEX].toString();

      consolidatedWorksheet
        .getCell(destinationRowIndex, DEST_CAT_CODE_INDEX)
        .setValue(categoryCode);
      consolidatedWorksheet
        .getCell(destinationRowIndex, DEST_ITEM_NUMBER_INDEX)
        .setValue(itemNumber);
      consolidatedWorksheet
        .getCell(destinationRowIndex, DEST_DESC_INDEX)
        .setValue(descriptionOfficial);
      consolidatedWorksheet
        .getCell(destinationRowIndex, DEST_MIN_PRICE_INDEX)
        .setValue(minPrice);

      ++destinationRowIndex;
    }
  }

  const endTimeMs = performance.now();

  console.log(`Execution time: ${(endTimeMs - startTimeMs) / MILLISECONDS_IN_SECOND} seconds`);
  console.log(`Total items consolidated: ${destinationRowIndex + 1}`);
}