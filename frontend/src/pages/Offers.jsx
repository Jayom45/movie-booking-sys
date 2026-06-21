import { motion } from 'framer-motion';
import { Copy, Check, Sparkles } from 'lucide-react';
import { useState } from 'react';

const offers = [
  { 
    title: 'Flat 50% off on first booking', 
    code: 'HELLOCINE', 
    copy: 'Get up to ₹150 off on your first ticket purchase via UPI.', 
    savings: 'Save 50%', 
    expiry: 'Valid till 31 Aug' 
  },
  { 
    title: 'Flat ₹150 off on cards', 
    code: 'CARD150', 
    copy: 'Premium formats deserve a premium discount. Valid weekdays.', 
    savings: 'Save ₹150', 
    expiry: 'Valid till 15 Sep' 
  },
  { 
    title: '25% off weekend shows', 
    code: 'WEEKEND25', 
    copy: 'Friday to Sunday on any 2D show. Min 2 tickets.', 
    savings: 'Save 25%', 
    expiry: 'Valid till 30 Sep' 
  },
  { 
    title: 'Snack Upgrade at ₹99', 
    code: 'POPCORN99', 
    copy: 'Add popcorn and beverage combo at Rs 99 with any booking.', 
    savings: 'Save ₹200', 
    expiry: 'Valid till 31 Oct' 
  }
];

function OfferCard({ offer, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.article 
      className="premium-offer-card glass-panel" 
      initial={{ opacity: 0, y: 18 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ delay: index * 0.06 }}
    >
      <div className="premium-offer-glow" />
      <div className="premium-offer-content">
        <div className="offer-type-label">
          <Sparkles size={12} />
          PROMO CODE
        </div>
        
        <h2 className="premium-offer-title">{offer.title}</h2>
        <p className="premium-offer-desc">{offer.copy}</p>
        
        <div className="premium-coupon-row">
          <code className="premium-coupon-code">{offer.code}</code>
          <button className={`premium-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
            {copied ? (
              <><Check size={14} /> Copied</>
            ) : (
              <><Copy size={14} /> Copy</>
            )}
          </button>
        </div>
        
        <div className="premium-offer-meta">
          {offer.savings} &middot; {offer.expiry}
        </div>
      </div>
    </motion.article>
  );
}

export default function Offers() {
  return (
    <section className="offers-page-wrapper">
      <div className="premium-offers-hero">
        <div className="premium-offers-hero-bg"></div>
        <h1 className="premium-offers-hero-title">
          Offers built for <span className="text-gradient">movie nights.</span>
        </h1>
      </div>

      <div className="premium-offer-grid">
        {offers.map((offer, index) => (
          <OfferCard key={offer.code} offer={offer} index={index} />
        ))}
      </div>
    </section>
  );
}
