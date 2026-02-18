
import { jsPDF } from "jspdf";

const LOGO_URL = "https://raw.githubusercontent.com/rcontrerasgon1098-sys/foto-ICSA/main/C5EDD674-8764-4E88-846B-BD9B9F1A18F2.png";

const toDataURL = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      const reader = new FileReader();
      reader.onloadend = function() {
        resolve(reader.result as string);
      }
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = reject;
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
  });
}

export const generateWorkOrderPDF = async (data: any) => {
  const doc = new jsPDF();
  const primaryColor = [56, 163, 165]; // #38A3A5

  // Header Background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, "F");
  
  // Add ICSA Logo
  try {
    const logoBase64 = await toDataURL(LOGO_URL);
    doc.addImage(logoBase64, "PNG", 10, 5, 80, 30);
  } catch (e) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("ICSA", 15, 23);
  }
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("ingeniería comunicaciones S.A.", 95, 23);
  
  doc.setFontSize(12);
  doc.text(`Folio: #${data.folio}`, 165, 23);

  // Content Start
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text("Orden de Trabajo Técnica", 15, 55);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const formattedDate = data.startDate ? new Date(data.startDate).toLocaleString('es-ES') : new Date().toLocaleDateString();
  doc.text(`Fecha/Hora: ${formattedDate}`, 15, 62);
  doc.text(`Estado: ${data.status === 'Completed' ? 'FINALIZADA' : 'PENDIENTE'}`, 15, 67);

  // Client Info Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DATOS DEL CLIENTE", 15, 80);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(15, 82, 195, 82);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Empresa: ${data.clientName || "N/A"}`, 15, 90);
  doc.text(`Dirección: ${data.address || "N/A"}`, 15, 96);
  doc.text(`Teléfono: ${data.clientPhone || "N/A"}`, 15, 102);
  doc.text(`Email: ${data.clientEmail || "N/A"}`, 15, 108);

  // Location Details
  doc.text(`Edificio: ${data.building || "N/A"}  |  Piso: ${data.floor || "N/A"}`, 15, 114);

  // Technical Specs Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES TÉCNICOS Y RED", 15, 125);
  doc.line(15, 127, 195, 127);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.text(`Señal: ${data.signalType || "Simple"} (${data.signalCount || 1} unidades)`, 15, 135);
  
  const cert = data.isCert ? `SÍ (${data.certifiedPointsCount || 0} puntos)` : "NO";
  const labeled = data.isLabeled ? `SÍ (${data.labelDetails || "N/A"})` : "NO";
  const canalized = data.isCanalized ? "SÍ" : "NO";

  doc.text(`Certificación: ${cert}`, 15, 142);
  doc.text(`Rotulación: ${labeled}`, 15, 148);
  doc.text(`Canalización: ${canalized}`, 15, 154);

  // Description Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text("RESUMEN DE ACTIVIDADES", 15, 165);
  doc.line(15, 167, 195, 167);

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  const splitDesc = doc.splitTextToSize(data.description || "Sin descripción adicional.", 180);
  doc.text(splitDesc, 15, 175);

  // Signatures
  const sigY = 240;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);

  // Tech Signature
  doc.text("TÉCNICO RESPONSABLE ICSA", 15, sigY - 5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text(`${data.techName || "N/A"}`, 15, sigY);
  doc.setFont("helvetica", "normal");
  doc.text(`RUT: ${data.techRut || "N/A"}`, 15, sigY + 5);
  if (data.techSignatureUrl) {
    try { doc.addImage(data.techSignatureUrl, "PNG", 15, sigY + 7, 50, 20); } catch(e) {}
  }

  // Client Signature
  doc.setTextColor(100, 100, 100);
  doc.text("RECEPCIÓN DE TRABAJOS", 130, sigY - 5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0,0,0);
  doc.text(`${data.clientReceiverName || "N/A"}`, 130, sigY);
  doc.setFont("helvetica", "normal");
  doc.text(`RUT: ${data.clientReceiverRut || "N/A"}`, 130, sigY + 5);
  if (data.clientReceiverEmail) {
    doc.setFontSize(7);
    doc.text(`Email: ${data.clientReceiverEmail}`, 130, sigY + 10);
  }
  if (data.clientSignatureUrl) {
    try { doc.addImage(data.clientSignatureUrl, "PNG", 130, sigY + 12, 50, 20); } catch(e) {}
  }

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("Documento electrónico generado por el Portal Operativo ICSA.", 105, 290, { align: "center" });

  doc.save(`OT-${data.folio}-${data.clientName?.replace(/\s+/g, '_')}.pdf`);
};
