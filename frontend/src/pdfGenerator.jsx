import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { getValidGenres } from './utils.js';

function formatDate(val) {
  return new Date(val).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatTime(val) {
  return new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function TicketTemplate({ booking, qrDataUrl, onReady }) {
  // We ensure the image loads before calling onReady
  return (
    <div style={{ width: '850px', padding: '40px', background: '#ffffff', fontFamily: '"Inter", "Roboto", "Helvetica Neue", sans-serif', color: '#111827', boxSizing: 'border-box' }}>
      <div style={{ border: '2px solid #e5e7eb', borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05)' }}>
        
        {/* HEADER */}
        <div style={{ background: '#030712', color: '#ffffff', padding: '24px 36px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '900', letterSpacing: '2px' }}>CINEBOOK</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#4ade80' }}></span>
            <span style={{ fontWeight: '700', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '1px', color: '#4ade80' }}>Booking Confirmed</span>
          </div>
        </div>
        
        {/* MAIN CONTENT */}
        <div style={{ display: 'flex', padding: '36px' }}>
          
          {/* POSTER */}
          <div style={{ width: '170px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
            <img 
              src={booking.show.movie.posterUrl} 
              style={{ width: '100%', height: '240px', objectFit: 'cover', display: 'block' }} 
              crossOrigin="anonymous" 
              onLoad={onReady}
              onError={onReady} // Fallback to ready even if image fails
              alt="Poster"
            />
          </div>
          
          {/* DETAILS */}
          <div style={{ flex: 1, padding: '0 36px', borderRight: '2px dashed #d1d5db' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '900', color: '#111827', lineHeight: '1.2' }}>{booking.show.movie.title}</h2>
            <p style={{ margin: '0 0 24px 0', fontSize: '14px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {getValidGenres(booking.show.movie.genre).join(', ')} • {booking.show.movie.language}
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Date & Time</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>{formatDate(booking.show.showTime)} <span style={{ color: '#d1d5db', margin: '0 6px' }}>|</span> {formatTime(booking.show.showTime)}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Theatre</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>{booking.show.theater}, {booking.show.city}</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Seats ({booking.seats.length} Tickets)</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                  {booking.seatDetails?.length > 0 ? booking.seatDetails.map(s => `${s.number} (${s.category})`).join(', ') : booking.seats.join(', ')}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Screen</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>{booking.show.screen}</p>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Amount Paid</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#111827' }}>Rs. {booking.totalAmount}</p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Payment Status</p>
                <p style={{ margin: '6px 0 0 0', fontSize: '16px', fontWeight: '800', color: '#4ade80' }}>Successful</p>
              </div>
            </div>
          </div>
          
          {/* QR CODE */}
          <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: '36px' }}>
            <div style={{ padding: '12px', background: '#f3f4f6', borderRadius: '16px', marginBottom: '20px' }}>
              <img src={qrDataUrl} style={{ width: '140px', height: '140px', display: 'block', mixBlendMode: 'multiply' }} alt="QR Code" />
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.5px' }}>Booking ID</p>
            <p style={{ margin: '6px 0 0 0', fontSize: '14px', fontWeight: '800', color: '#111827', fontFamily: 'monospace', letterSpacing: '0.5px' }}>{booking._id}</p>
          </div>
        </div>
        
        {/* FOOTER */}
        <div style={{ background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '20px 36px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>Thank you for choosing CineBook. Please present this ticket at the cinema entrance.</p>
        </div>
      </div>
    </div>
  );
}

export async function generatePdfBlob(booking) {
  // 1. Generate QR Data URL
  const qrDataUrl = await QRCode.toDataURL(booking._id, { 
    width: 300, 
    margin: 1, 
    color: { dark: '#000000', light: '#ffffff' } 
  });

  // 2. Create hidden container
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '850px';
  document.body.appendChild(container);

  // 3. Render React Component
  const root = createRoot(container);
  
  await new Promise((resolve) => {
    let isResolved = false;
    
    const handleReady = () => {
      if (!isResolved) {
        isResolved = true;
        setTimeout(resolve, 200);
      }
    };

    root.render(<TicketTemplate booking={booking} qrDataUrl={qrDataUrl} onReady={handleReady} />);
    setTimeout(handleReady, 1500);
  });

  // 4. Run html2canvas
  const canvas = await html2canvas(container, {
    scale: 2, 
    useCORS: true, 
    backgroundColor: '#ffffff',
    logging: false,
    onclone: (clonedDoc) => {
      // html2canvas crashes when parsing oklch() colors in global stylesheets.
      // Replace them with a safe fallback only in the cloned document for PDF rendering.
      const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach(s => {
        if (s.tagName.toLowerCase() === 'style') {
          s.innerHTML = s.innerHTML.replace(/oklch\([^)]+\)/g, '#000000');
        } else if (s.href && !s.href.includes('fonts')) {
          s.remove(); // Remove production CSS links to avoid parsing errors
        }
      });
    }
  });

  // 5. Cleanup DOM
  root.unmount();
  document.body.removeChild(container);

  // 6. Generate PDF
  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const renderWidth = pdfWidth - (margin * 2);
  const renderHeight = (canvas.height * renderWidth) / canvas.width;

  pdf.addImage(imgData, 'JPEG', margin, margin, renderWidth, renderHeight);

  return pdf.output('blob');
}

export async function generateAndOpenTicketPdf(booking) {
  try {
    const pdfBlob = await generatePdfBlob(booking);
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    alert('Failed to generate PDF ticket. Please try again.');
  }
}
