const specs = {
    Actor: {
        extends: [
            { t: "Inject.TextFileContent", v: "<lib>/actors/vertx-node.base.yaml" },
        ],
        Variables: {
            t: "ActorVariables",
            v: {},
        },
        SessionRegistry: {
            t: "GenericSessionRegistry",
            v: {
                t: "Container",
                factory: {},
            },
        },
        Services: {
            t: "DomainFunctionServices",
            v: {},
        },
    },
};

export function getActorSpecification(actorMnemonic) {
    const spec = specs[actorMnemonic];
    if (!spec) return null;
    const { extends: _, ...rest } = spec;
    return rest;
}
