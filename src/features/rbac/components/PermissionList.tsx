interface PermissionListProps {
  permissions: string[];
  compact?: boolean;
}

export function PermissionList({ permissions, compact = false }: PermissionListProps) {
  const grouped: Record<string, string[]> = {};

  for (const p of permissions) {
    const [resource, action] = p.split(":");
    if (!grouped[resource]) grouped[resource] = [];
    grouped[resource].push(action);
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {permissions.map((p) => (
          <span
            key={p}
            className="inline-flex items-center rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700"
          >
            {p}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([resource, actions]) => (
        <div key={resource}>
          <h4 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            {resource}
          </h4>
          <div className="mt-1 flex flex-wrap gap-1">
            {actions.map((action) => (
              <span
                key={`${resource}:${action}`}
                className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
