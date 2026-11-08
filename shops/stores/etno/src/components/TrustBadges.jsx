import GppGoodIcon from '@mui/icons-material/GppGood';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import './TrustBadges.css';

function TrustBadges() {
  return (
    <div className="trust-badges">
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <GppGoodIcon />
        </div>
        <p>Гарантия качества</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <LocalShippingIcon />
        </div>
        <p>Доставка по городу</p>
      </div>
      <div className="trust-badge">
        <div className="trust-badge__icon">
          <Diversity3Icon />
        </div>
        <p>Этно товары</p>
      </div>
    </div>
  );
}

export default TrustBadges;
