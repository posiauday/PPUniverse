import { PROPERTY_KINDS, PROPERTY_KIND_LABEL, type ComponentProperty } from "@ppu/domain-content";
import { KindChip } from "./replicas/ButtonReplica";

/** How a property is called in a formula: functions, events and actions show their parameters. */
function signature(property: ComponentProperty): string {
  const callable = ["InputFunction", "OutputFunction", "Event", "Action"].includes(property.kind);
  return callable
    ? `${property.name}(${property.parameters.map((p) => p.name).join(", ")})`
    : property.name;
}

/**
 * The properties table (MVP-049): every custom property, read from the
 * component's own YAML, grouped by kind, with its type, default and
 * description, and each parameter of functions and events.
 */
export function PropertyTable({ properties }: { properties: readonly ComponentProperty[] }) {
  const groups = PROPERTY_KINDS.map((kind) => ({
    kind,
    items: properties.filter((property) => property.kind === kind),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        // Scrolls sideways on a phone, so it can take focus and has a name (WCAG 2.1.1).
        <div
          key={group.kind}
          role="region"
          aria-label={`${PROPERTY_KIND_LABEL[group.kind]} table`}
          tabIndex={0}
          className="overflow-x-auto"
        >
          <table className="w-full min-w-[34rem] border-collapse text-left text-[0.9375rem]">
            <caption className="mb-2 text-left font-display text-lg font-bold">
              {PROPERTY_KIND_LABEL[group.kind]}
            </caption>
            <thead>
              <tr className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
                <th scope="col" className="py-2 pr-3">
                  Property
                </th>
                <th scope="col" className="py-2 pr-3">
                  Kind
                </th>
                <th scope="col" className="py-2 pr-3">
                  Type
                </th>
                <th scope="col" className="py-2">
                  Default
                </th>
              </tr>
            </thead>
            <tbody>
              {group.items.map((property) => (
                <tr key={property.name} className="border-t border-border align-top">
                  <th scope="row" className="py-2 pr-3 font-normal">
                    <code className="font-mono text-sm font-semibold">{signature(property)}</code>
                    <p className="text-sm text-muted-foreground">{property.description}</p>
                    {property.parameters.length > 0 ? (
                      <ul className="mt-1 text-sm text-muted-foreground">
                        {property.parameters.map((parameter) => (
                          <li key={parameter.name}>
                            <code className="font-mono">{parameter.name}</code> (
                            {parameter.dataType}): {parameter.description}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </th>
                  <td className="py-2 pr-3">
                    <KindChip kind={property.kind} />
                  </td>
                  <td className="py-2 pr-3">
                    {property.dataType === "None" ? "—" : property.dataType}
                  </td>
                  <td className="py-2">
                    {property.defaultValue === null ? (
                      "—"
                    ) : (
                      <code className="font-mono text-sm break-all">{property.defaultValue}</code>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
