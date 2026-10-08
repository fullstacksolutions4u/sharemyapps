import { useState } from 'react';
import { FileText, Download, Upload } from 'lucide-react';
import jsPDF from 'jspdf';
import logo from '../../assets/logo.png';

export default function AdminDocumentsSection() {
  const [proprietorName, setProprietorName] = useState('Tony Kuriakose');
  const [purpose, setPurpose] = useState('mentorship and freelance services related to web development');
  const [companyName, setCompanyName] = useState('ShareMyApps');
  const [website, setWebsite] = useState('sharemyapps.in');
  const [email, setEmail] = useState('hello@sharemyapps.in');
  const [signatureImage, setSignatureImage] = useState(null);
  const [sealImage, setSealImage] = useState(null);

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignatureImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSealUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSealImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Add Letterhead (Logo + Company Name)
    // Assuming logo is a PNG. If it's a different format, adjust the type.
    const imgProps = doc.getImageProperties(logo);
    const pdfLogoWidth = 40;
    const pdfLogoHeight = (imgProps.height * pdfLogoWidth) / imgProps.width;
    doc.addImage(logo, 'PNG', 15, 15, pdfLogoWidth, pdfLogoHeight);
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 166, 147); // Brand color #00A693 approx
    doc.text(companyName, 60, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Website: www.${website}`, 60, 32);
    doc.text(`Email: ${email}   |   Phone: +91 9961618585`, 60, 37);
    doc.text(`Address: Elampakappillly PO, Koovappady, Perumbavoor, Ernakulam, Pin: 683544`, 60, 42);

    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.line(15, 48, pageWidth - 15, 48);

    // 2. Document Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('To Whomsoever It May Concern', pageWidth / 2, 63, { align: 'center' });

    // 3. Document Body
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const startY = 83;
    const lineHeight = 5; // jsPDF default line height for 11pt is approx 4.5mm-5mm
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;

    const paragraph1 = `Considered and approved taking up an Online Payment Gateway Service from Razorpay Software Private Limited`;
    
    const paragraph2 = `"RESOLVED THAT the Proprietor/Partners/Trustees be and is hereby accorded take Payment Gateway services from "Razorpay Software Private Limited"`;
    
    const paragraph3 = `"RESOLVED FURTHER THAT ${proprietorName} (Proprietor) of the company, be and is hereby singly authorized to sign and execute on behalf of the company, all agreements, undertakings and any other documents that may be necessary for availing the said services from Razorpay Software Private Limited and to do all such acts that may be necessary to implement the foregoing resolution. This is also to certify that the payment gateway would only be used for ${purpose}. In case of any additional services added in future, Razorpay must be consulted before using the payment gateway for such services. This is to also certify that Razorpay Software Private Limited holds the right to hold the funds for ${companyName} in case of any suspected fraudulent activity, and that Razorpay Software Private Limited holds the right to refund any payment in case of any dispute. This is also to certify that the payment gateway services will be used only for accepting payments for ${purpose}, on website ${website}."`;
    
    const paragraph4 = `We agree for "Razorpay Software Private Limited" to terminate the account with immediate effect in case of any policy violation and Razorpay will not be liable for any loss incurred.`;

    let currentY = startY;

    const printParagraph = (text) => {
      const lines = doc.splitTextToSize(text, maxLineWidth);
      doc.text(lines, margin, currentY);
      currentY += lines.length * lineHeight; // Removed extra +5 to reduce gap further
    };

    printParagraph(paragraph1);
    currentY += 5;
    
    doc.setFont('helvetica', 'bold');
    printParagraph(paragraph2);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    // For paragraph 3, we want to highlight some parts as bold according to template, but standard jsPDF doesn't support rich text inline easily. We will print it normally.
    printParagraph(paragraph3);
    currentY += 5;

    printParagraph(paragraph4);
    currentY += 15;

    // 4. Signatures
    doc.setFont('helvetica', 'bold');
    doc.text(`Name of the Proprietor:`, margin, currentY);
    doc.text(`Signature`, pageWidth - margin - 40, currentY);
    
    doc.setFont('helvetica', 'normal');
    doc.text(proprietorName, margin, currentY + 10);

    if (signatureImage) {
      // Add signature image
      doc.addImage(signatureImage, 'PNG', pageWidth - margin - 45, currentY + 5, 40, 20); // Adjust size as needed
    } else {
      doc.text('(Please sign here)', pageWidth - margin - 40, currentY + 15);
    }

    if (sealImage) {
      // Add seal image in the center
      doc.addImage(sealImage, 'PNG', (pageWidth / 2) - 20, currentY, 40, 40); // 40x40 seal
    }

    // Save PDF
    doc.save('Razorpay_Resolution.pdf');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-[#1A1A1A]">Documents Manager</h2>

      <div className="bg-white border border-[#E5E1DA] rounded-2xl p-6 space-y-6 max-w-3xl">
        <div className="flex items-center gap-3 pb-4 border-b border-[#E5E1DA]">
          <div className="p-2.5 bg-[#00A693]/10 rounded-xl">
            <FileText size={24} className="text-[#00A693]" />
          </div>
          <div>
            <h3 className="font-semibold text-[#1A1A1A]">Razorpay Resolution Document</h3>
            <p className="text-sm text-[#6B7280]">Generate the required acknowledgement document for Razorpay.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">Proprietor Name</label>
            <input 
              type="text" 
              value={proprietorName} 
              onChange={(e) => setProprietorName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">Company Name</label>
            <input 
              type="text" 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">Purpose of Payment Gateway</label>
            <input 
              type="text" 
              value={purpose} 
              onChange={(e) => setPurpose(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">Website URL</label>
            <input 
              type="text" 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#1A1A1A]">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#E5E1DA] rounded-xl text-sm focus:outline-none focus:border-[#00A693] focus:ring-2 focus:ring-[#00A693]/10 transition"
            />
          </div>
          
          <div className="space-y-1.5 md:col-span-1">
            <label className="text-sm font-medium text-[#1A1A1A]">Upload Signature (PNG/JPG)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-[#F3F0EB] text-[#1A1A1A] hover:bg-[#E5E1DA] text-sm font-medium rounded-xl cursor-pointer transition">
                <Upload size={16} />
                <span>Select Signature Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleSignatureUpload}
                  className="hidden" 
                />
              </label>
              {signatureImage && (
                <div className="h-10 px-3 bg-white border border-[#E5E1DA] rounded-lg flex items-center">
                  <img src={signatureImage} alt="Signature Preview" className="h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-1">
            <label className="text-sm font-medium text-[#1A1A1A]">Upload Company Seal (Optional)</label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-[#F3F0EB] text-[#1A1A1A] hover:bg-[#E5E1DA] text-sm font-medium rounded-xl cursor-pointer transition">
                <Upload size={16} />
                <span>Select Seal Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleSealUpload}
                  className="hidden" 
                />
              </label>
              {sealImage && (
                <div className="h-10 px-3 bg-white border border-[#E5E1DA] rounded-lg flex items-center">
                  <img src={sealImage} alt="Seal Preview" className="h-full object-contain" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button 
            onClick={generatePDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#00A693] hover:bg-[#007D6F] text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-[#00A693]/20"
          >
            <Download size={16} />
            Generate PDF
          </button>
        </div>
      </div>
    </div>
  );
}
