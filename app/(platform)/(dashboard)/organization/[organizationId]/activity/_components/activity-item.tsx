import { AuditLog } from '@prisma/client';

interface ActivityItemProps {
  data: AuditLog;
}

export const ActivityItem = ({ data }: ActivityItemProps) => {
  return (
    <div>
      <p>activity</p>
    </div>
  );
};
