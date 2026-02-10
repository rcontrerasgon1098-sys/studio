import { jsPDF } from "jspdf";

export const generateWorkOrderPDF = (data: any) => {
  const doc = new jsPDF();
  const primaryColor = [56, 163, 165]; // #38A3A5

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.text("ICSA", 15, 23);
  doc.setFontSize(10);
  doc.text("ingeniería comunicaciones S.A.", 15, 30);
  
  doc.setFontSize(12);
  doc.text(`Folio: ${data.folio}`, 160, 25);

  // Content
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text("Orden de Trabajo Digital", 15, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Fecha: ${data.date || new Date().toLocaleDateString()}`, 15, 62);
  doc.text(`Estado: COMPLETADA`, 15, 67);

  // Client Info
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.text("DATOS DEL CLIENTE", 15, 80);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(15, 82, 195, 82);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Nombre: ${data.client || data.clientData?.name}`, 15, 90);
  doc.text(`Contacto: ${data.contact || data.clientData?.contact || "N/A"}`, 15, 97);

  // Specs
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("ESPECIFICACIONES TÉCNICAS", 15, 110);
  doc.line(15, 112, 195, 112);

  doc.setTextColor(0, 0, 0);
  doc.text(`Tipo de Señal: ${data.specs?.signalType || "Simple"}`, 15, 120);
  doc.text(`Certificación: ${data.specs?.isCert ? "Sí" : "No"}`, 15, 127);
  doc.text(`Planos: ${data.specs?.isPlan ? "Sí" : "No"}`, 15, 134);
  doc.text(`Edificio/Piso: ${data.specs?.location || "N/A"}`, 15, 141);

  // Description
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DESCRIPCIÓN DE TRABAJOS", 15, 155);
  doc.line(15, 157, 195, 157);

  doc.setTextColor(0, 0, 0);
  const splitDesc = doc.splitTextToSize(data.description || "Sin descripción", 180);
  doc.text(splitDesc, 15, 165);

  // Signatures
  if (data.signatures?.techUrl) {
    doc.text("Firma Técnico", 15, 230);
    doc.addImage(data.signatures.techUrl, "PNG", 15, 235, 60, 30);
  }

  if (data.signatures?.clientUrl) {
    doc.text("Firma Cliente", 130, 230);
    doc.addImage(data.signatures.clientUrl, "PNG", 130, 235, 60, 30);
  }

  doc.save(`OT-${data.folio}.pdf`);
};
