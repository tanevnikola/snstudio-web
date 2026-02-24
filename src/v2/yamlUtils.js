import jsYaml from 'js-yaml';
import { isCollectionInjection, isDelegating, isMapInjection } from "./parameterSpecUtils";

export function dumpAsText(yaml) {
    return yaml ? jsYaml.dump(yaml, { lineWidth: -1, noRefs: true }) : ''
}

export function extractParameterYaml(yaml, parameterSpec) {
    if (isMapInjection(parameterSpec) || isCollectionInjection(parameterSpec)) {
        return yaml?.[parameterSpec.name];
    }
    if (isDelegating(parameterSpec)) {
        return normalizeParameterValue(yaml, parameterSpec);
    }
    return normalizeParameterValue(yaml?.[parameterSpec?.name], parameterSpec);
}

export function normalizeParameterValue(parameterYaml, parameterSpec) {
    if (parameterYaml?.t == null) {
        return { t: parameterSpec.mnemonic, v: parameterYaml ?? null };
    }
    return parameterYaml;
}

export function extractTaskYaml(yaml) {
    return yaml?.task ?? (
        yaml?.tasks 
            ? { t: 'Task.Chain', v: yaml.tasks } 
            : null);
}

export function extractTaskMnemonic(taskYaml) {
    return taskYaml?.t ?? null;
}