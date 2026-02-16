
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
  
  // Add ICSA Logo (Rectangular format)
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
  doc.text("Orden de Trabajo Digital", 15, 55);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const formattedDate = data.startDate ? new Date(data.startDate).toLocaleString('es-ES') : new Date().toLocaleDateString();
  doc.text(`Fecha/Hora: ${formattedDate}`, 15, 62);
  doc.text(`Supervisor: ${data.creatorEmail || "N/A"}`, 15, 67);
  doc.text(`Estado: ${data.status === 'Completed' ? 'COMPLETADA' : 'PENDIENTE'}`, 15, 72);

  // Client Info Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFontSize(12);
  doc.text("DATOS DEL CLIENTE", 15, 85);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.line(15, 87, 195, 87);

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Nombre: ${data.clientName || "N/A"}`, 15, 95);
  doc.text(`Contacto: ${data.clientContact || "N/A"}`, 15, 102);

  // Technical Specs Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("ESPECIFICACIONES TÉCNICAS", 15, 115);
  doc.line(15, 117, 195, 117);

  doc.setTextColor(0, 0, 0);
  doc.text(`Ubicación: ${data.location || "N/A"}`, 15, 125);
  doc.text(`CDS/Canalización: ${data.cdsCanalization || "N/A"}`, 15, 132);
  doc.text(`Tipo de Señal: ${data.signalType || "Simple"}`, 15, 139);
  
  const cert = data.isCert ? "SÍ" : "NO";
  const plan = data.isPlan ? "SÍ" : "NO";
  const sw = data.connectionSwitch ? "SÍ" : "NO";
  const hub = data.hubConnection ? "SÍ" : "NO";
  doc.text(`Certificación: ${cert}  |  Planos: ${plan}  |  Switch: ${sw}  |  Hub: ${hub}`, 15, 146);

  // Description Section
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("DESCRIPCIÓN DE TRABAJOS", 15, 160);
  doc.line(15, 162, 195, 162);

  doc.setTextColor(0, 0, 0);
  const splitDesc = doc.splitTextToSize(data.description || "Sin descripción detallada.", 180);
  doc.text(splitDesc, 15, 170);

  // Multimedia (Sketch)
  if (data.sketchImageUrl) {
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("BOSQUEJO / FOTO", 15, 205);
    doc.line(15, 207, 195, 207);
    try {
        // Render at a high resolution aspect ratio
        doc.addImage(data.sketchImageUrl, "JPEG", 15, 210, 80, 45, undefined, 'FAST');
    } catch(e) {
        console.error("No se pudo cargar la imagen del bosquejo", e);
    }
  }

  // Signatures at the bottom - Optimized for quality
  const sigY = 265;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);

  // Tech Signature Info
  if (data.techName || data.techRut || data.techSignatureUrl) {
    doc.text("VALIDACIÓN TÉCNICO ICSA", 15, sigY - 12);
    doc.setTextColor(0,0,0);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.techName || "N/A"}`, 15, sigY - 7);
    doc.setFont("helvetica", "normal");
    doc.text(`RUT: ${data.techRut || "N/A"}`, 15, sigY - 2);
    
    if (data.techSignatureUrl) {
      try { 
        // Use a box for better framing
        doc.setDrawColor(240, 240, 240);
        doc.rect(15, sigY, 60, 25);
        doc.addImage(data.techSignatureUrl, "PNG", 17, sigY + 2, 56, 21, undefined, 'FAST'); 
      } catch(e) {
        console.error("Error rendering tech signature", e);
      }
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text("(Pendiente de firma)", 15, sigY + 10);
    }
  }

  // Client Signature Info
  doc.setTextColor(100, 100, 100);
  if (data.clientReceiverName || data.clientReceiverRut || data.clientSignatureUrl) {
    doc.text("VALIDACIÓN RECEPCIÓN TERRENO", 130, sigY - 12);
    doc.setTextColor(0,0,0);
    doc.setFont("helvetica", "bold");
    doc.text(`${data.clientReceiverName || "N/A"}`, 130, sigY - 7);
    doc.setFont("helvetica", "normal");
    doc.text(`RUT: ${data.clientReceiverRut || "N/A"}`, 130, sigY - 2);
    
    if (data.clientSignatureUrl) {
      try { 
        doc.setDrawColor(240, 240, 240);
        doc.rect(130, sigY, 60, 25);
        doc.addImage(data.clientSignatureUrl, "PNG", 132, sigY + 2, 56, 21, undefined, 'FAST'); 
      } catch(e) {
        console.error("Error rendering client signature", e);
      }
    } else {
      doc.setTextColor(150, 150, 150);
      doc.text("(Pendiente de firma)", 130, sigY + 10);
    }
  }

  // Footer text
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text("Documento generado digitalmente por el portal operativo ICSA.", 105, 290, { align: "center" });

  doc.save(`OT-${data.folio}-${data.clientName?.replace(/\s+/g, '_')}.pdf`);
};
