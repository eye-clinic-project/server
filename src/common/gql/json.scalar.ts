import { GraphQLScalarType, Kind } from 'graphql';

function parseLiteral(
  value: Parameters<NonNullable<GraphQLScalarType['parseLiteral']>>[0],
): unknown {
  switch (value.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return value.value;
    case Kind.INT:
      return Number.parseInt(value.value, 10);
    case Kind.FLOAT:
      return Number.parseFloat(value.value);
    case Kind.NULL:
      return null;
    case Kind.LIST:
      return value.values.map(parseLiteral);
    case Kind.OBJECT:
      return Object.fromEntries(
        value.fields.map((field) => [
          field.name.value,
          parseLiteral(field.value),
        ]),
      );
    default:
      return null;
  }
}

export const GraphQL_JSON = new GraphQLScalarType({
  name: 'JSON',
  description: 'Arbitrary JSON value',
  serialize: (value: unknown) => value,
  parseValue: (value: unknown) => value,
  parseLiteral,
});
