import { Amplify } from 'aws-amplify'
import { generateClient } from 'aws-amplify/api'
import awsConfig from '../src/aws-config'
import dummyUser from '../src/data/user.json'
import dummyAssets from '../src/data/assets.json'
import dummyDebts from '../src/data/debts.json'
import dummyBudgets from '../src/data/budgets.json'
import dummyPlans from '../src/data/plans.json'

// Configure Amplify
Amplify.configure(awsConfig)

const client = generateClient()

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...')

    // Create User
    console.log('Creating user...')
    const user = await client.models.User.create({
      id: dummyUser.id,
      name: dummyUser.name,
      email: dummyUser.email,
      birthday: dummyUser.birthday,
      retirementAge: dummyUser.retirementAge,
      createdAt: dummyUser.createdAt,
      updatedAt: dummyUser.updatedAt
    })
    console.log('✅ User created:', user)

    // Create Assets
    console.log('Creating assets...')
    for (const asset of dummyAssets) {
      const createdAsset = await client.models.Asset.create({
        id: asset.id,
        userId: asset.userId,
        name: asset.name,
        currentValue: asset.currentValue,
        annualAPY: asset.annualAPY,
        notes: asset.notes,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt
      })
      console.log('✅ Asset created:', createdAsset.data?.name)
    }

    // Create Debts
    console.log('Creating debts...')
    for (const debt of dummyDebts) {
      const createdDebt = await client.models.Debt.create({
        id: debt.id,
        userId: debt.userId,
        name: debt.name,
        currentBalance: debt.currentBalance,
        interestRate: debt.interestRate,
        minimumPayment: debt.minimumPayment,
        notes: debt.notes,
        createdAt: debt.createdAt,
        updatedAt: debt.updatedAt
      })
      console.log('✅ Debt created:', createdDebt.data?.name)
    }

    // Create Budgets
    console.log('Creating budgets...')
    for (const budget of dummyBudgets) {
      const createdBudget = await client.models.Budget.create({
        id: budget.id,
        userId: budget.userId,
        name: budget.name,
        isActive: budget.isActive,
        income: budget.income,
        expenses: budget.expenses,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt
      })
      console.log('✅ Budget created:', createdBudget.data?.name)
    }

    // Create Plans
    console.log('Creating plans...')
    for (const plan of dummyPlans) {
      const createdPlan = await client.models.Plan.create({
        id: plan.id,
        userId: plan.userId,
        name: plan.name,
        description: plan.description,
        isActive: plan.isActive,
        months: plan.months,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt
      })
      console.log('✅ Plan created:', createdPlan.data?.name)
    }

    console.log('🎉 Database seeding completed successfully!')

  } catch (error) {
    console.error('❌ Error seeding database:', error)
  }
}

// Run the seeding
seedDatabase()
