import { motion } from 'framer-motion';
import { BadgePercent, CreditCard, Gift, Popcorn, Sparkles, TicketPercent } from 'lucide-react';

const offers = [
  { icon: TicketPercent, title: 'Weekend Premiere', code: 'WEEKEND25', copy: '25% off on premium morning shows and selected screens.' },
  { icon: CreditCard, title: 'Platinum Card Deal', code: 'CARD150', copy: 'Flat Rs 150 off on selected debit and credit cards.' },
  { icon: Popcorn, title: 'Snack Upgrade', code: 'POPCORN99', copy: 'Add popcorn and beverage combo at Rs 99 with any booking.' },
  { icon: Gift, title: 'First Night Out', code: 'HELLOCINE', copy: 'New users get a special discount on their first two tickets.' }
];

export default function Offers() {
  return (
    <section>
      <div className="page-hero compact-hero">
        <p className="eyebrow">Rewards</p>
        <h1>Offers that make movie night feel bigger.</h1>
        <p>Premium deals, card offers, snack upgrades, and launch rewards for CineBook members.</p>
      </div>

      <div className="offer-grid">
        {offers.map((offer, index) => {
          const Icon = offer.icon;
          return (
            <motion.article className="offer-card" key={offer.code} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
              <div className="offer-icon"><Icon size={24} /></div>
              <span className="premium-label"><Sparkles size={14} /> Limited</span>
              <h2>{offer.title}</h2>
              <p>{offer.copy}</p>
              <div className="coupon-row">
                <code>{offer.code}</code>
                <BadgePercent size={18} />
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
