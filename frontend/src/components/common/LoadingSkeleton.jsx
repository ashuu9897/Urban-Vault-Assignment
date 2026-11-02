import { Box, Card, Skeleton, Stack } from '@mui/material';
import PropTypes from 'prop-types';

function CardSkeleton() {
  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Skeleton width="40%" height={24} />
        <Skeleton variant="rounded" width={72} height={22} />
      </Stack>
      <Skeleton width="30%" />
      <Skeleton width="85%" />
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <Box>
      <Skeleton width="55%" height={32} />
      <Skeleton width="35%" />
      <Skeleton width="80%" />
      <Skeleton variant="rounded" height={56} sx={{ mt: 2 }} />
      <Skeleton variant="rounded" height={96} sx={{ mt: 3 }} />
    </Box>
  );
}

/** Placeholder shown while data loads: a stack of ticket cards, or a ticket detail. */
export function LoadingSkeleton({ variant, count = 3 }) {
  if (variant === 'detail') return <DetailSkeleton />;
  return (
    <Stack spacing={1.5} aria-hidden>
      {Array.from({ length: count }, (_, index) => (
        <CardSkeleton key={index} />
      ))}
    </Stack>
  );
}

LoadingSkeleton.propTypes = {
  variant: PropTypes.oneOf(['card', 'detail']).isRequired,
  count: PropTypes.number,
};
