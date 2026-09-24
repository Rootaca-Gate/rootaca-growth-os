/**
 * Offering PDF download reuses the shared, battle-tested school-facing renderer
 * from the programs feature. Both documents share the exact same `.pdf-page`
 * A4 sheet contract, so we delegate rather than duplicate the html2canvas +
 * jsPDF pipeline.
 */
export { downloadHtmlAsPdf } from '../programs/program-pdf-download';
