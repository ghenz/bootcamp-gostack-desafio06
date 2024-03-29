import csvParse from 'csv-parse';
import fs from 'fs';
import { getCustomRepository, In } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoryRepository from '../repositories/CategoryRepository';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CsvTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getCustomRepository(CategoryRepository);
    const readFile = fs.createReadStream(filePath);

    const parser = csvParse({
      from_line: 2,
      trim: true,
    });

    const csvParser = readFile.pipe(parser);

    const transactions: CsvTransaction[] = [];
    const categories: string[] = [];

    csvParser.on('data', async line => {
      const [title, type, value, category] = line;

      if (!title || !type || !value || !category) return;

      categories.push(category);

      const transaction = {
        title,
        type,
        value,
        category,
      };

      transactions.push(transaction);
    });

    await new Promise(resolve => csvParser.on('end', resolve));

    const filteredCategories = categories.filter((category, index) => {
      return categories.indexOf(category) === index;
    });

    const findedCategories = await categoryRepository.find({
      where: {
        title: In(filteredCategories),
      },
    });

    const categoriesTitle = findedCategories.map((category: Category) => {
      return category.title;
    });

    const addNewCategories = filteredCategories.filter(category => {
      return !categoriesTitle.includes(category);
    });

    const newCategories = categoryRepository.create(
      addNewCategories.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    const allCategories = [...newCategories, ...findedCategories];

    const newTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(category => {
          return category.title === transaction.category;
        }),
      })),
    );

    await transactionsRepository.save(newTransactions);

    await fs.promises.unlink(filePath);

    return newTransactions;
  }
}

export default ImportTransactionsService;
