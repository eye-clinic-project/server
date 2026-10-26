
import { Injectable } from '@nestjs/common';
import {
  CreateOptions,
  DeleteResult,
  InsertManyOptions,
  Model,
  PopulateOptions,
  ProjectionType,
  QueryFilter,
  QueryOptions,
  Types,
  UpdateQuery,
  UpdateResult,
  UpdateWithAggregationPipeline,
} from 'mongoose';

@Injectable()
export abstract class DatabaseRepository<T> {
  constructor(
    protected readonly model: Model<T>,
  ) {}

  async create({
    data,
    options,
  }: {
    data: Partial<T>;
    options?: CreateOptions;
  }) {
    return new this.model(data).save(options);
  }

  async createMany({
    data,
    options,
  }: {
    data: Partial<T>[];
    options?: InsertManyOptions;
  }) {
    return options
      ? this.model.insertMany(data, options)
      : this.model.insertMany(data);
  }

  async findById({
    _id,
    projection,
    options,
  }: {
    _id: Types.ObjectId | string;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
  }) {
    const query = this.model.findById(_id, projection);

    if (options?.populate) {
      query.populate(options.populate as PopulateOptions[]);
    }

    if (options?.lean) {
      return query.lean().exec();
    }

    return query.exec();
  }

  async findOne({
    filter = {},
    projection,
    options,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
  }) {
    const query = this.model.findOne(filter, projection);

    if (options?.populate) {
      query.populate(options.populate as PopulateOptions[]);
    }

    if (options?.sort) {
      query.sort(options.sort);
    }

    if (options?.lean) {
      return query.lean().exec();
    }

    return query.exec();
  }

  async find({
    filter = {},
    projection,
    options = {},
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
  }) {
    const query = this.model.find(filter, projection);

    if (options.populate) {
      query.populate(options.populate as PopulateOptions[]);
    }

    if (options.sort) {
      query.sort(options.sort);
    }

    if (options.skip !== undefined) {
      query.skip(options.skip);
    }

    if (options.limit !== undefined) {
      query.limit(options.limit);
    }

    if (options.lean) {
      return query.lean().exec();
    }

    return query.exec();
  }

  async paginate({
    filter = {},
    projection,
    options = {},
    page = 1,
    size = 5,
  }: {
    filter?: QueryFilter<T>;
    projection?: ProjectionType<T>;
    options?: QueryOptions<T>;
    page?: number | string;
    size?: number | string;
  }) {
    const currentPage = Math.max(1, Math.floor(Number(page) || 1));
    const limit = Math.max(1, Math.floor(Number(size) || 5));
    const skip = (currentPage - 1) * limit;

    const [count, docs] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.find({
        filter,
        projection,
        options: {
          ...options,
          skip,
          limit,
        },
      }),
    ]);

    return {
      docs,
      count,
      currentPage,
      size: limit,
      pages: Math.ceil(count / limit),
    };
  }

  async updateOne({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<T>;
    update: UpdateQuery<T>;
    options?: Omit<QueryOptions<T>, 'session'> & {
      session?: Exclude<QueryOptions<T>['session'], null>;
    };
  }): Promise<UpdateResult> {
    return this.model.updateOne(
      filter,
      {
        ...update,
        $inc: {
          ...update.$inc,
          __v: 1,
        },
      },
      {
        ...options,
        runValidators: true,
      },
    ).exec();
  }

  async updateMany({
    filter,
    update,
    options,
  }: {
    filter: QueryFilter<T>;
    update: UpdateQuery<T> | UpdateWithAggregationPipeline;
    options?: Omit<QueryOptions<T>, 'session'> & {
      session?: Exclude<QueryOptions<T>['session'], null>;
    };
  }): Promise<UpdateResult> {
    return this.model.updateMany(
      filter,
      update,
      options,
    ).exec();
  }

  async findOneAndUpdate({
    filter,
    update,
    options = {},
    populate = [],
  }: {
    filter: QueryFilter<T>;
    update: UpdateQuery<T>;
    options?: QueryOptions<T>;
    populate?: PopulateOptions[];
  }) {
    return this.model.findOneAndUpdate(
      filter,
      {
        ...update,
        $inc: {
          ...update.$inc,
          __v: 1,
        },
      },
      {
        new: true,
        runValidators: true,
        ...options,
      },
    ).populate(populate).exec();
  }

  async findByIdAndUpdate({
    _id,
    update,
    options = {},
  }: {
    _id: Types.ObjectId | string;
    update: UpdateQuery<T>;
    options?: QueryOptions<T>;
  }) {
    return this.model.findByIdAndUpdate(
      _id,
      {
        ...update,
        $inc: {
          ...update.$inc,
          __v: 1,
        },
      },
      {
        new: true,
        runValidators: true,
        ...options,
      },
    ).exec();
  }

  async deleteOne({
    filter,
  }: {
    filter: QueryFilter<T>;
  }): Promise<DeleteResult> {
    return this.model.deleteOne(filter).exec();
  }

  async deleteMany({
    filter,
  }: {
    filter: QueryFilter<T>;
  }): Promise<DeleteResult> {
    return this.model.deleteMany(filter).exec();
  }

  async findOneAndDelete({
    filter,
  }: {
    filter: QueryFilter<T>;
  }) {
    return this.model.findOneAndDelete(filter).exec();
  }

  async findByIdAndDelete({
    _id,
  }: {
    _id: Types.ObjectId | string;
  }) {
    return this.model.findByIdAndDelete(_id).exec();
  }
}
