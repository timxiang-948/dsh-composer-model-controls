/**
 * Pure UI plugin: the empty apply exists so the package appears in the host
 * cordis.yml / Loader tree; the browser half ships via `exports["./client"]`
 * and is discovered through `package.json#dsh.client`.
 */
export function apply() {}
