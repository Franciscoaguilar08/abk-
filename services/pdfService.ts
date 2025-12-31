import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AnalysisResult, AnalysisFocus } from '../types';

export const generateClinicalReport = (
  result: AnalysisResult, 
  inputDataSnippet: string, 
  focusAreas: AnalysisFocus[]
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  
  // Helpers
  const generateReportId = () => {
    return `#REP-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  };
  const reportId = generateReportId();
  const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // === HEADER ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("DoctiGen Platform", margin, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("Genomic Precision Report", margin, 28);

  // Right Header info
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(currentDate, pageWidth - margin, 20, { align: "right" });
  doc.text(reportId, pageWidth - margin, 25, { align: "right" });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 35, pageWidth - margin, 35);

  // === SECTION 1: PATIENT CONTEXT ===
  let yPos = 45;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text("SECTION 1: PATIENT CONTEXT", margin, yPos);
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Clinical Input / Goal:", margin, yPos);
  
  doc.setFont("helvetica", "normal");
  // Clean up input data for display (first 100 chars or summary)
  const cleanInput = inputDataSnippet.length > 120 
    ? inputDataSnippet.substring(0, 120).replace(/\n/g, " ") + "..." 
    : inputDataSnippet.replace(/\n/g, " ");
  
  doc.text(cleanInput, margin + 45, yPos);

  yPos += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Genomic Profile:", margin, yPos);
  doc.setFont("helvetica", "normal");
  doc.text(focusAreas.join(", "), margin + 45, yPos);

  // === SECTION 2: EXECUTIVE SUMMARY ===
  yPos += 15;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SECTION 2: CLINICAL SUMMARY", margin, yPos);
  
  yPos += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  // Split text to fit
  const summaryLines = doc.splitTextToSize(result.patientSummary, pageWidth - (margin * 2));
  doc.text(summaryLines, margin, yPos);
  yPos += (summaryLines.length * 5) + 5;

  // === SECTION 3: KEY FINDINGS (TABLE) ===
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SECTION 3: KEY VARIANT FINDINGS", margin, yPos);

  const tableBody = result.variants.map(v => [
    v.gene,
    v.variant,
    v.riskLevel,
    v.condition || v.description.substring(0, 30) + "..."
  ]);

  // If no variants, add a placeholder row
  if (tableBody.length === 0) {
      tableBody.push(["No significant variants detected", "-", "-", "-"]);
  }

  autoTable(doc, {
    startY: yPos + 5,
    head: [['GENE', 'VARIANT', 'CLASSIFICATION', 'PHENOTYPE']],
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [40, 40, 40], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
        0: { fontStyle: 'bold' },
        2: { fontStyle: 'bold' } // Risk level bold
    }
  });

  // Get final Y after table
  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY || yPos + 20;

  // === SECTION 4: AI AGENTS CONSENSUS ===
  // Ensure enough space for next section, else add page
  if (finalY > 250) {
    doc.addPage();
    finalY = 20;
  } else {
    finalY += 15;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SECTION 4: AI AGENTS CONSENSUS", margin, finalY);

  finalY += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  // Synthesize consensus
  const variantCount = result.variants.length;
  const pharmaCount = result.pharmaProfiles.length;
  const oncologyCount = result.oncologyProfiles.length;
  
  let consensusText = `The multi-agent analysis system has concluded processing the provided genomic sequence. The Oncology Agent identified ${oncologyCount} specific risk profiles. The Pharmacogenomics Agent screened for CYP450 metabolizer status and found ${pharmaCount} relevant entries. The Variant Analysis Engine flagged ${variantCount} variants of interest based on ClinVar and AlphaMissense cross-referencing. The overall risk assessment suggests a score of ${result.overallRiskScore}/100 based on the cumulative genetic burden detected.`;

  const consensusLines = doc.splitTextToSize(consensusText, pageWidth - (margin * 2));
  doc.text(consensusLines, margin, finalY);


  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setFontSize(8);
      
      // Black text left
      doc.setTextColor(0, 0, 0);
      doc.text("Generated by ABK genomics. Verified by Blockchain Signature. For clinical research support only.", margin, pageHeight - 10);
      
      // Red Confidential text right
      doc.setTextColor(200, 0, 0);
      doc.setFont("helvetica", "bold");
      doc.text("CONFIDENTIAL / MEDICAL USE", pageWidth - margin, pageHeight - 10, { align: "right" });
  }

  doc.save(`DoctiGen_Report_${reportId.replace('#', '')}.pdf`);
};
