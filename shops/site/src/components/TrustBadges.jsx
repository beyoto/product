import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import CheckroomIcon from '@mui/icons-material/Checkroom';
import VerifiedIcon from '@mui/icons-material/Verified';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import DiamondIcon from '@mui/icons-material/Diamond';
import DoorFrontIcon from '@mui/icons-material/DoorFront';
import StraightenIcon from '@mui/icons-material/Straighten';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import WeekendIcon from '@mui/icons-material/Weekend';
import SpaIcon from '@mui/icons-material/Spa';
import DevicesIcon from '@mui/icons-material/Devices';
import { useSite } from '../SiteContext.jsx';
import './TrustBadges.css';

// Ключи иконок задаёт тип магазина (back/src/config/siteTypes.js → badges).
const ICONS = {
  flower: LocalFloristIcon,
  gift: CardGiftcardIcon,
  heart: FavoriteBorderIcon,
  style: CheckroomIcon,
  verified: VerifiedIcon,
  chat: ForumOutlinedIcon,
  diamond: DiamondIcon,
  door: DoorFrontIcon,
  ruler: StraightenIcon,
  car: DirectionsCarIcon,
  home: WeekendIcon,
  spa: SpaIcon,
  devices: DevicesIcon,
};

function TrustBadges() {
  const { info, type } = useSite();
  const badges = type.badges
    .map((badge, index) => ({ ...badge, text: info.badges?.[index] || badge.text }))
    .filter((badge) => badge.text);

  return (
    <div className="trust-badges">
      {badges.map(({ icon, text }) => {
        const Icon = ICONS[icon] || VerifiedIcon;
        return (
          <div className="trust-badge" key={text}>
            <div className="trust-badge__icon"><Icon /></div>
            <p>{text}</p>
          </div>
        );
      })}
    </div>
  );
}

export default TrustBadges;
