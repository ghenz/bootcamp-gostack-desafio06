import { EntityRepository, Repository, getRepository } from 'typeorm';

import Category from '../models/Category';

@EntityRepository(Category)
class TransactionsRepository extends Repository<Category> {
  public async findOrCreateCategory(category: string): Promise<Category> {
    const categoryRepository = getRepository(Category);

    let transactionCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!transactionCategory) {
      transactionCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(transactionCategory);
    }

    return transactionCategory;
  }
}

export default TransactionsRepository;
