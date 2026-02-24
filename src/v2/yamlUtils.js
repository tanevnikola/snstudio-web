import jsYaml from 'js-yaml';
import { isCollectionInjection, isDelegating, isMapInjection } from "./parameterSpecUtils";
import { isImplementing } from './mnemoUtils';

export function dumpAsText(yaml) {
    return yaml ? jsYaml.dump(yaml, { lineWidth: -1, noRefs: true }) : ''
}

export function extractParameterYaml(yaml, parameterSpec) {
    const paramYaml = isDelegating(parameterSpec) 
        ? yaml
        : yaml?.[parameterSpec?.name];
        
    if (paramYaml == null) {
        if (isCollectionInjection(parameterSpec)) {
            return [];
        }
        if (isMapInjection(parameterSpec)) {
            return {};
        }
        return  { t: parameterSpec.mnemonic };
    }

    if (isImplementing(paramYaml.t, "ResourceInjector") 
        || isMapInjection(parameterSpec) 
        || isCollectionInjection(parameterSpec)) {
        return paramYaml;
    }

    return normalizeParameterValue(paramYaml, parameterSpec);
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